import init from 'env-paths';
import extract from 'extract-zip';
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { chmod, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'stream';
import { ReadableStream } from 'stream/web';
import { z } from 'zod';
import { useEnvironment } from '../../utils/env/env';

const paths = init('twitchqna');

const zipLocation = join(paths.cache, 'chatdownloader.zip');
const binaryLocation = join(paths.cache, 'TwitchDownloaderCLI');

export const checkForBinary = async () => {
  try {
    await stat(binaryLocation);
    return true;
  } catch {
    return false;
  }
};

const GitHubReleaseResponse = z.object({
  assets: z.array(
    z.object({
      browser_download_url: z.string(),
      name: z.string()
    })
  ),
  name: z.string()
});

const getOS = (platform: NodeJS.Platform) => {
  switch (platform) {
    case 'darwin':
      return 'MacOS';
    case 'win32':
      return 'Windows';
    case 'linux':
      return 'Linux';
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
};

const getArch = (arch: NodeJS.Architecture) => {
  switch (arch) {
    case 'x64':
      return '-x64';
    case 'arm':
      return 'Arm';
    case 'arm64':
      return 'Arm64';
    default:
      throw new Error(`Unsupported architecture: ${arch}`);
  }
};

export const getAppropriateBinary = async () => {
  const url = `https://api.github.com/repos/lay295/TwitchDownloader/releases/latest`;
  const response = await fetch(url);
  const json = await response.json();
  const data = GitHubReleaseResponse.parse(json);

  const asset = data.assets.find(asset => {
    const filename = asset.name.match(/(?<=-)(.*)(?=.zip)/)?.[0];
    if (!filename) throw new Error(`Invalid filename: ${asset.name}`);
    return filename.endsWith(`${getOS(process.platform)}${getArch(process.arch)}`);
  });
  if (!asset) {
    throw new Error(`No binary found for ${getOS(process.platform)}${getArch(process.arch)}`);
  }

  return asset;
};

export const downloadBinary = async () => {
  const asset = await getAppropriateBinary();
  const response = await fetch(asset.browser_download_url);
  if (!response.ok) {
    throw new Error(`Unexpected response ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error(`No response body`);
  }

  await mkdir(paths.cache, { recursive: true });
  const writeStream = createWriteStream(zipLocation);
  await pipeline(Readable.fromWeb(response.body as ReadableStream), writeStream);
  await extract(zipLocation, { dir: paths.cache });
};

const runBinary = async (args: string[]) => {
  return new Promise<void>(async (resolve, reject) => {
    await chmod(binaryLocation, '755');

    const cli = spawn(binaryLocation, args, { stdio: 'pipe' });
    cli.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`TwitchDownloaderCLI exited with code ${code}`));
      }
    });
    cli.on('error', err => {
      reject(err);
    });
  });
};

export const runTwitchDownloader = async (args: string[]) => {
  const { variables } = useEnvironment();
  if (variables.NODE_ENV !== 'development') {
    console.warn('TwitchDownloaderCLI will not be available in production');
  }

  const hasBinary = await checkForBinary();
  if (!hasBinary) {
    await downloadBinary();
  }

  await runBinary(args);
};
