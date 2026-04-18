import type { StickerSpec, StickerValueMap } from './types';

const parseRotationDegrees = (rotation: string | undefined): number => {
  if (!rotation) {
    return 0;
  }

  const parsedRotation = Number.parseFloat(rotation);
  return Number.isFinite(parsedRotation) ? parsedRotation : 0;
};

export const createStickerValueMap = <Id extends string>(stickers: readonly StickerSpec<Id>[]): StickerValueMap<Id> =>
  Object.fromEntries(
    stickers.map((sticker, index) => [
      sticker.id,
      {
        ...sticker.initialValue,
        rotation: sticker.initialValue.rotation ?? parseRotationDegrees(sticker.geometry.rotation),
        zIndex: sticker.initialValue.zIndex ?? 1000 + index
      }
    ])
  ) as StickerValueMap<Id>;
