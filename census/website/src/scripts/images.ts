import { randomUUID } from 'crypto';
import { mkdir, readdir, readFile, unlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { basename, extname, isAbsolute, join } from 'path';
import { trace } from 'potrace';
import sharp, { Sharp } from 'sharp';
async function processImages(src: string, dst: string) {
  await mkdir(dst, { recursive: true });

  async function processDir(dir: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const id = basename(entry.name).replace(extname(entry.name), '');
      const outputId = id.toLowerCase();
      const filePath = join(dir, entry.name);
      const data = await getSharpFromPath(filePath);
      const sourceMetadata = await data.metadata();
      const cropped = await shrinkwrapCropSharp(data, 0);
      const croppedMetadata = await cropped.metadata();
      const { width = 0 } = croppedMetadata;
      const { padding, thickness } = getOutlineSizes(width);
      const padded = cropped.clone().ensureAlpha().extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      });
      const paddedMetadata = await padded.metadata();
      console.log('[images:process]', {
        id,
        filePath,
        source: {
          width: sourceMetadata.width,
          height: sourceMetadata.height,
          channels: sourceMetadata.channels,
          hasAlpha: sourceMetadata.hasAlpha
        },
        cropped: {
          width: croppedMetadata.width,
          height: croppedMetadata.height,
          channels: croppedMetadata.channels,
          hasAlpha: croppedMetadata.hasAlpha
        },
        computed: {
          padding,
          thickness
        },
        padded: {
          width: paddedMetadata.width,
          height: paddedMetadata.height,
          channels: paddedMetadata.channels,
          hasAlpha: paddedMetadata.hasAlpha
        }
      });
      const outlined = await drawOutlineSharp(padded, thickness);
      await writeFile(join(dst, outputId + '.outlined.png'), outlined);

      const silhouette = await generateSilhouette(sharp(outlined));
      await writeFile(join(dst, outputId + '.silhouette.svg'), silhouette);
    }
  }

  await processDir(src);
}

(async () => {
  const [, , source, destination] = process.argv;
  if (!source || !destination) throw new Error('Usage: script <source> <destination>');

  const srcPath = isAbsolute(source) ? source : join(process.cwd(), source);
  const dstPath = isAbsolute(destination) ? destination : join(process.cwd(), destination);
  await processImages(srcPath, dstPath);
})();

const generateSilhouette = async (sharpInstance: Sharp) => {
  const tmp = join(tmpdir(), `${randomUUID()}.png`);

  try {
    await sharpInstance.ensureAlpha().extractChannel('alpha').threshold(0).negate().png().toFile(tmp);

    return await new Promise<string>((resolve, reject) => {
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
  } finally {
    await unlink(tmp).catch(() => undefined);
  }
};

const getSharpFromPath = async (path: string) => {
  const data = await readFile(path);
  return sharp(data);
};

const getOutlineSizes = (width: number) => {
  const size = Math.max(4, Math.min(120, Math.round(width * 0.04)));
  return { padding: size, thickness: size };
};

const shrinkwrapCropSharp = async (sharpInstance: Sharp, padding: number = 0) => {
  const alpha = sharpInstance.clone().ensureAlpha().extractChannel('alpha');
  const { data, info } = await alpha.raw().toBuffer({ resolveWithObject: true });

  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[y * info.width + x] === 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX === -1 || maxY === -1) {
    return sharp(await sharpInstance.clone().ensureAlpha().png().toBuffer());
  }

  return sharpInstance
    .clone()
    .ensureAlpha()
    .extract({
      left: minX,
      top: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    });
};

const drawOutlineSharp = async (sharpInstance: Sharp, thickness: number = 60, blurSigma: number = 1) => {
  const outlineColor = { r: 255, g: 255, b: 255, alpha: 1 };
  const image = sharpInstance.clone().ensureAlpha();
  const inputBuffer = await image.toBuffer();

  const alphaMask = image.extractChannel('alpha').png();
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
