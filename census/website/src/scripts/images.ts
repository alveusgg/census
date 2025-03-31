import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { mkdir, readdir, readFile, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { basename, extname, isAbsolute, join } from 'path';
import { trace } from 'potrace';
import sharp, { Sharp } from 'sharp';
async function processImages(src: string, dst: string, rawKey: string) {
  const keyBytes = Buffer.from(rawKey, 'hex');
  let manifest: Record<string, { id: string; iv: string }> = {};
  const manifestPath = join(src, 'manifest.json');

  if (existsSync(manifestPath)) {
    manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
  }

  await mkdir(dst, { recursive: true });

  async function processDir(dir: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        await processDir(join(dir, entry.name));
      } else if (extname(entry.name).toLowerCase() === '.png') {
        const natId = basename(entry.name).replace(extname(entry.name), '');
        if (manifest[natId]) {
          console.log(`Skipping ${natId} as it already exists`);
          continue;
        }

        const filePath = join(dir, entry.name);
        const id = randomUUID();
        const data = await getSharpFromPath(filePath);
        const outlined = await drawOutlineSharp(data);
        const iv = crypto.getRandomValues(new Uint8Array(16));
        const algo = { name: 'AES-CTR', counter: iv, length: 64 };
        const key = await crypto.subtle.importKey('raw', keyBytes, algo, false, ['encrypt']);
        const encrypted = await crypto.subtle.encrypt(algo, key, outlined);
        const outName = id + '.encrypted' + extname(entry.name).toLowerCase();
        await writeFile(join(dst, outName), Buffer.from(encrypted));

        const stringIv = Buffer.from(iv).toString('hex');
        if (!testDecryption(join(dst, outName), rawKey, stringIv)) {
          throw new Error('Failed to encrypt image');
        }

        const silhouette = await generateSilhouette(filePath);
        await writeFile(join(dst, id + '.svg'), silhouette);

        manifest[natId] = { id, iv: stringIv };
      }
    }
  }

  await processDir(src);
  await writeFile(join(src, 'manifest.json'), JSON.stringify(manifest, null, 2));
}

(async () => {
  const [, , source, destination, key] = process.argv;
  if (!source || !destination || !key) throw new Error('Usage: script <source> <destination> <hexkey>');

  const srcPath = isAbsolute(source) ? source : join(process.cwd(), source);
  const dstPath = isAbsolute(destination) ? destination : join(process.cwd(), destination);
  await processImages(srcPath, dstPath, key);
})();

const testDecryption = async (path: string, rawKey: string, iv: string) => {
  const keyBytes = hexToUint8Array(rawKey);
  const ivBytes = hexToUint8Array(iv);

  const algo = { name: 'AES-CTR', counter: ivBytes, length: 64 };
  const key = await crypto.subtle.importKey('raw', keyBytes, algo, false, ['decrypt']);
  const data = await readFile(path);
  const decrypted = await crypto.subtle.decrypt(algo, key, data);
  return isValidPng(decrypted);
};

const hexToUint8Array = (hex: string) => {
  const length = hex.length / 2;
  const view = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    view[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return view;
};

const isValidPng = (data: ArrayBuffer): boolean => {
  const header = new Uint8Array(data.slice(0, 8));
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const isValid = pngSignature.every((byte, i) => byte === header[i]);
  return isValid;
};

const generateSilhouette = async (path: string) => {
  return new Promise<string>((resolve, reject) => {
    // Convert the image to grayscale and resize for performance
    const tmp = join(tmpdir(), randomUUID());
    sharp(path)
      .ensureAlpha()
      .extractChannel('alpha')
      .threshold(0)
      .negate()
      .toFile(tmp)
      .then(() => {
        trace(
          tmp,
          {
            color: '#F2E8BF',
            background: 'transparent',
            threshold: -1
          },
          (err, svg) => {
            if (err) return reject(err);
            resolve(svg);
          }
        );
      });
  });
};

const getSharpFromPath = async (path: string) => {
  const data = await readFile(path);
  return sharp(data);
};

const drawOutlineSharp = async (sharpInstance: Sharp, thickness: number = 60, blurSigma: number = 1) => {
  const outlineColor = { r: 255, g: 255, b: 255, alpha: 1 };
  const inputBuffer = await sharpInstance.toBuffer();

  const alphaMask = sharpInstance.clone().extractChannel('alpha').png();
  const negatedAlphaMask = sharp(await alphaMask.clone().blur(2).negate().toBuffer());
  const bgMask = negatedAlphaMask.blur(thickness / 2).unflatten();

  let bg = bgMask.composite([
    {
      input: {
        create: {
          width: 1,
          height: 1,
          channels: 4,
          background: outlineColor
        }
      },
      blend: 'in',
      tile: true
    }
  ]);

  bg = sharp(await bg.toBuffer());

  bg = sharp(await bg.blur(blurSigma).toBuffer());

  bg = bg.composite([
    {
      input: inputBuffer,
      blend: 'over'
    }
  ]);

  return bg.toBuffer();
};
