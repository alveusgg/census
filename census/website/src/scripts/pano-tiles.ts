import { spawn } from 'child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'path';

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
  baseWidth: number;
  tileFormat: string;
  panOffsetDeg: number;
  tiltOffsetDeg: number;
  manifestOnly: boolean;
  levels: LevelConfig[];
}

const DEFAULT_SOURCE = '../../scratch/source.exr';
const DEFAULT_OUTPUT = 'src/components/pano/tiles/garden';
const DEFAULT_MANIFEST = 'src/components/pano/garden.tiles.ts';

async function main() {
  const config = parseArgs(process.argv.slice(2));
  const source = resolvePath(config.source);
  const output = resolvePath(config.output);
  const manifest = resolvePath(config.manifest);
  const tempDir = await mkdtemp(join(tmpdir(), 'pano-tiles-'));

  try {
    if (!config.manifestOnly) {
      const sourceInfo = await getImageInfo(source);
      const sourceFit = getAspectFit(sourceInfo, 2);

      await mkdir(output, { recursive: true });
      await renderBase({ source, sourceFit, config, output });

      for (const level of config.levels) {
        await renderLevel({ source, sourceFit, config, output, tempDir, level });
      }
    }

    await writeManifest({ config, manifest, output });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function renderBase({
  source,
  sourceFit,
  config,
  output
}: {
  source: string;
  sourceFit: AspectFit;
  config: PanoTileConfig;
  output: string;
}) {
  const baseHeight = Math.round(config.baseWidth / 2);
  const destination = join(output, `base.${config.tileFormat}`);

  await runOiiotool([
    source,
    ...getSourcePrepArgs(sourceFit, config),
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
  sourceFit,
  config,
  output,
  tempDir,
  level
}: {
  source: string;
  sourceFit: AspectFit;
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
    ...getSourcePrepArgs(sourceFit, config),
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

async function writeManifest({
  config,
  manifest,
  output
}: {
  config: PanoTileConfig;
  manifest: string;
  output: string;
}) {
  await mkdir(dirname(manifest), { recursive: true });

  const baseHeight = Math.round(config.baseWidth / 2);
  const imports = [
    `import type { PanoTileManifest } from './lib/PanoMapManager';`,
    `import baseUrl from '${getAssetImportPath(manifest, join(output, `base.${config.tileFormat}`))}';`
  ];
  const levels = config.levels.map(level => {
    const columns = Math.ceil(level.width / level.tileWidth);
    const rows = Math.ceil(level.height / level.tileHeight);
    const tileRows: string[][] = [];

    for (let row = 0; row < rows; row++) {
      const tileRow: string[] = [];

      for (let column = 0; column < columns; column++) {
        const importName = `${level.id}Tile${row}_${column}Url`;
        imports.push(
          `import ${importName} from '${getAssetImportPath(
            manifest,
            join(output, level.id, String(row), `${column}.${config.tileFormat}`)
          )}';`
        );
        tileRow.push(importName);
      }

      tileRows.push(tileRow);
    }

    return {
      ...level,
      columns,
      rows,
      tiles: tileRows
    };
  });

  await writeFile(
    manifest,
    `${imports.join('\n')}

export const gardenPanoManifest: PanoTileManifest = {
  projection: 'equirectangular',
  base: {
    src: baseUrl,
    width: ${config.baseWidth},
    height: ${baseHeight}
  },
  levels: [
${levels.map(formatLevelManifest).join(',\n')}
  ]
};
`
  );
}

function formatLevelManifest(level: LevelConfig & { columns: number; rows: number; tiles: string[][] }) {
  return `    {
      id: ${JSON.stringify(level.id)},
      width: ${level.width},
      height: ${level.height},
      tileWidth: ${level.tileWidth},
      tileHeight: ${level.tileHeight},
      showBelowFov: ${level.showBelowFov},
      columns: ${level.columns},
      rows: ${level.rows},
      tiles: [
${level.tiles.map(row => `        [${row.join(', ')}]`).join(',\n')}
      ]
    }`;
}

function getAssetImportPath(manifest: string, asset: string) {
  const path = relative(dirname(manifest), asset).split(sep).join('/');
  const relativePath = path.startsWith('.') ? path : `./${path}`;

  return `${relativePath}?url`;
}

interface ImageInfo {
  width: number;
  height: number;
}

/** How to make the source 2:1, anchored to the bottom (trim or pad at the top). */
interface AspectFit {
  width: number;
  height: number;
  /** oiiotool args applied before color convert / resize */
  prepArgs: string[];
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

/**
 * Fit to a target aspect ratio, keeping the bottom of the frame.
 * - Too tall: crop height (trim from the top).
 * - Too wide: pad height (black at the top) so full width is preserved.
 */
function getAspectFit(source: ImageInfo, aspectRatio: number): AspectFit {
  const sourceAspect = source.width / source.height;

  if (Math.abs(sourceAspect - aspectRatio) < 1e-6) {
    return { width: source.width, height: source.height, prepArgs: [] };
  }

  if (sourceAspect < aspectRatio) {
    // Too tall → trim from the top, keep bottom.
    const width = source.width;
    const height = Math.round(width / aspectRatio);
    const y = source.height - height;
    return {
      width,
      height,
      prepArgs: ['--cut', `${width}x${height}+0+${y}`]
    };
  }

  // Too wide → keep full width, pad at the top to reach aspectRatio.
  const width = source.width;
  const height = Math.round(width / aspectRatio);
  const topPad = height - source.height;
  return {
    width,
    height,
    prepArgs: ['--origin', `+0+${topPad}`, '--fullsize', `${width}x${height}`, '--croptofull']
  };
}

function getSourcePrepArgs(sourceFit: AspectFit, config: PanoTileConfig) {
  return [...sourceFit.prepArgs, ...getOffsetArgs(config, { width: sourceFit.width, height: sourceFit.height })];
}

/**
 * Pan/tilt are in equirect degrees on the fitted (2:1) canvas.
 * - pan: circular shift in X (360° wrap)
 * - tilt: non-circular shift in Y with black fill (avoid wrapping nadir into the padded zenith)
 * Positive pan moves content right; positive tilt moves content down.
 */
function getOffsetArgs(config: PanoTileConfig, size: ImageInfo) {
  const panOffsetPx = Math.round((config.panOffsetDeg / 360) * size.width);
  const tiltOffsetPx = Math.round((config.tiltOffsetDeg / 180) * size.height);
  const args: string[] = [];

  if (panOffsetPx !== 0) {
    args.push('--cshift', formatOffset(panOffsetPx, 0));
  }

  if (tiltOffsetPx !== 0) {
    args.push('--origin', formatOffset(0, tiltOffsetPx), '--fullsize', `${size.width}x${size.height}`, '--croptofull');
  }

  return args;
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

  // Source is 44592×19432 (wider than 2:1). Keep full width and pad top → 44592×22296.
  const ultraWidth = numberArg(values, 'ultra-width', 44592);
  const ultraHeight = numberArg(values, 'ultra-height', Math.round(ultraWidth / 2));
  const highWidth = numberArg(values, 'high-width', Math.round(ultraWidth / 2));
  const highHeight = numberArg(values, 'high-height', Math.round(highWidth / 2));
  const mediumWidth = numberArg(values, 'medium-width', Math.round(highWidth / 2));
  const mediumHeight = numberArg(values, 'medium-height', Math.round(mediumWidth / 2));
  const tileSize = numberArg(values, 'tile-size', 1024);

  return {
    source: values.get('source') ?? DEFAULT_SOURCE,
    output: values.get('output') ?? DEFAULT_OUTPUT,
    manifest: values.get('manifest') ?? DEFAULT_MANIFEST,
    baseWidth: numberArg(values, 'base-width', 4096),
    tileFormat: values.get('format') ?? 'webp',
    panOffsetDeg: numberArg(values, 'pan-offset-deg', -8.96),
    tiltOffsetDeg: numberArg(values, 'tilt-offset-deg', -13.01),
    manifestOnly: booleanArg(values, 'manifest-only', false),
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
      },
      {
        id: 'ultra',
        width: ultraWidth,
        height: ultraHeight,
        tileWidth: tileSize,
        tileHeight: tileSize,
        showBelowFov: numberArg(values, 'ultra-fov', 8)
      }
    ]
  };
}

function booleanArg(values: Map<string, string>, key: string, fallback: boolean) {
  const value = values.get(key);
  if (value === undefined) return fallback;

  if (value === 'true') return true;
  if (value === 'false') return false;

  throw new Error(`Invalid boolean for --${key}: ${value}`);
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
