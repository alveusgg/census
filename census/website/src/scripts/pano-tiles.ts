import { spawn } from 'child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { basename, dirname, isAbsolute, join, resolve } from 'path';

interface LevelConfig {
  id: string;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  showBelowFov: number;
}

interface PanoTileConfig {
  source: string;
  output: string;
  manifest: string;
  publicPath: string;
  baseWidth: number;
  tileFormat: string;
  panOffsetDeg: number;
  tiltOffsetDeg: number;
  levels: LevelConfig[];
}

const DEFAULT_SOURCE = '../../scratch/source.exr';
const DEFAULT_OUTPUT = 'public/pano/garden';
const DEFAULT_MANIFEST = 'src/components/pano/garden.tiles.ts';
const DEFAULT_PUBLIC_PATH = '/pano/garden';

async function main() {
  const config = parseArgs(process.argv.slice(2));
  const source = resolvePath(config.source);
  const output = resolvePath(config.output);
  const manifest = resolvePath(config.manifest);
  const sourceInfo = await getImageInfo(source);
  const tempDir = await mkdtemp(join(tmpdir(), 'pano-tiles-'));

  try {
    await mkdir(output, { recursive: true });
    await renderBase({ source, sourceInfo, config, output });

    for (const level of config.levels) {
      await renderLevel({ source, sourceInfo, config, output, tempDir, level });
    }

    await writeManifest({ config, manifest });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function renderBase({
  source,
  sourceInfo,
  config,
  output
}: {
  source: string;
  sourceInfo: ImageInfo;
  config: PanoTileConfig;
  output: string;
}) {
  const baseHeight = Math.round(config.baseWidth / 2);
  const destination = join(output, `base.${config.tileFormat}`);

  await runOiiotool([
    source,
    ...getOffsetArgs(config, sourceInfo),
    '--ch',
    'R,G,B',
    '--colorconvert',
    'linear',
    'sRGB',
    '--resize',
    `${config.baseWidth}x${baseHeight}`,
    '-d',
    'uint8',
    '-o',
    destination
  ]);
}

async function renderLevel({
  source,
  sourceInfo,
  config,
  output,
  tempDir,
  level
}: {
  source: string;
  sourceInfo: ImageInfo;
  config: PanoTileConfig;
  output: string;
  tempDir: string;
  level: LevelConfig;
}) {
  const levelDir = join(output, level.id);
  const levelImage = join(tempDir, `${level.id}.tif`);

  await mkdir(levelDir, { recursive: true });
  await runOiiotool([
    source,
    ...getOffsetArgs(config, sourceInfo),
    '--ch',
    'R,G,B',
    '--colorconvert',
    'linear',
    'sRGB',
    '--resize',
    `${level.width}x${level.height}`,
    '-d',
    'uint8',
    '-o',
    levelImage
  ]);

  const columns = Math.ceil(level.width / level.tileWidth);
  const rows = Math.ceil(level.height / level.tileHeight);

  for (let row = 0; row < rows; row++) {
    const rowDir = join(levelDir, String(row));
    await mkdir(rowDir, { recursive: true });

    for (let column = 0; column < columns; column++) {
      const x = column * level.tileWidth;
      const y = row * level.tileHeight;
      const width = Math.min(level.tileWidth, level.width - x);
      const height = Math.min(level.tileHeight, level.height - y);
      const destination = join(rowDir, `${column}.${config.tileFormat}`);

      await runOiiotool([levelImage, '--cut', `${width}x${height}+${x}+${y}`, '-o', destination]);
    }
  }
}

async function writeManifest({ config, manifest }: { config: PanoTileConfig; manifest: string }) {
  await mkdir(dirname(manifest), { recursive: true });

  const baseHeight = Math.round(config.baseWidth / 2);
  const levels = config.levels.map(level => ({
    ...level,
    columns: Math.ceil(level.width / level.tileWidth),
    rows: Math.ceil(level.height / level.tileHeight),
    urlTemplate: `${config.publicPath}/{z}/{y}/{x}.${config.tileFormat}`
  }));

  await writeFile(
    manifest,
    `import type { PanoTileManifest } from './lib/PanoMapManager';

export const gardenPanoManifest: PanoTileManifest = ${JSON.stringify(
      {
        projection: 'equirectangular',
        base: {
          src: `${config.publicPath}/base.${config.tileFormat}`,
          width: config.baseWidth,
          height: baseHeight
        },
        levels
      },
      null,
      2
    )};
`
  );
}

interface ImageInfo {
  width: number;
  height: number;
}

async function getImageInfo(source: string): Promise<ImageInfo> {
  const output = await runOiiotool(['--info', source]);
  const match = output.match(/:\s+(\d+)\s+x\s+(\d+),/);
  if (!match) throw new Error(`Unable to read dimensions from ${basename(source)}`);

  return {
    width: Number(match[1]),
    height: Number(match[2])
  };
}

function getOffsetArgs(config: PanoTileConfig, sourceInfo: ImageInfo) {
  const panOffsetPx = Math.round((config.panOffsetDeg / 360) * sourceInfo.width);
  const tiltOffsetPx = Math.round((config.tiltOffsetDeg / 180) * sourceInfo.height);

  if (panOffsetPx === 0 && tiltOffsetPx === 0) return [];
  return ['--cshift', formatOffset(panOffsetPx, tiltOffsetPx)];
}

function formatOffset(x: number, y: number) {
  return `${x >= 0 ? '+' : ''}${x}${y >= 0 ? '+' : ''}${y}`;
}

async function runOiiotool(args: string[]) {
  return await new Promise<string>((resolvePromise, reject) => {
    const child = spawn('oiiotool', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    child.stdout.on('data', chunk => stdout.push(chunk));
    child.stderr.on('data', chunk => stderr.push(chunk));
    child.on('error', reject);
    child.on('close', code => {
      const output = Buffer.concat(stdout).toString('utf8');
      const error = Buffer.concat(stderr).toString('utf8');

      if (code === 0) {
        resolvePromise(output);
        return;
      }

      reject(new Error(`oiiotool failed with exit code ${code}\n${error}`));
    });
  });
}

function parseArgs(args: string[]): PanoTileConfig {
  const values = new Map<string, string>();

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (!arg?.startsWith('--')) throw new Error(`Unexpected argument: ${arg}`);

    const key = arg.slice(2);
    const value = args[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
    values.set(key, value);
    index++;
  }

  const highWidth = numberArg(values, 'high-width', 24240);
  const highHeight = numberArg(values, 'high-height', Math.round(highWidth / 2));
  const mediumWidth = numberArg(values, 'medium-width', Math.round(highWidth / 2));
  const mediumHeight = numberArg(values, 'medium-height', Math.round(mediumWidth / 2));
  const tileSize = numberArg(values, 'tile-size', 1024);

  return {
    source: values.get('source') ?? DEFAULT_SOURCE,
    output: values.get('output') ?? DEFAULT_OUTPUT,
    manifest: values.get('manifest') ?? DEFAULT_MANIFEST,
    publicPath: values.get('public-path') ?? DEFAULT_PUBLIC_PATH,
    baseWidth: numberArg(values, 'base-width', 4096),
    tileFormat: values.get('format') ?? 'webp',
    panOffsetDeg: numberArg(values, 'pan-offset-deg', 0),
    tiltOffsetDeg: numberArg(values, 'tilt-offset-deg', 0),
    levels: [
      {
        id: 'medium',
        width: mediumWidth,
        height: mediumHeight,
        tileWidth: tileSize,
        tileHeight: tileSize,
        showBelowFov: numberArg(values, 'medium-fov', 32)
      },
      {
        id: 'high',
        width: highWidth,
        height: highHeight,
        tileWidth: tileSize,
        tileHeight: tileSize,
        showBelowFov: numberArg(values, 'high-fov', 16)
      }
    ]
  };
}

function numberArg(values: Map<string, string>, key: string, fallback: number) {
  const value = values.get(key);
  if (value === undefined) return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid number for --${key}: ${value}`);

  return parsed;
}

function resolvePath(path: string) {
  return isAbsolute(path) ? path : resolve(process.cwd(), path);
}

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
