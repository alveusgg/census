import type { StickerSpec, StickerValueMap } from './types';

const randomizeCoordinate = (): number => Math.random();

const parseRotationDegrees = (rotation: string | undefined): number => {
  if (!rotation) {
    return 0;
  }

  const parsedRotation = Number.parseFloat(rotation);
  return Number.isFinite(parsedRotation) ? parsedRotation : 0;
};

export const createStickerValueMap = (
  stickers: readonly StickerSpec[],
  initialValue?: StickerValueMap
): StickerValueMap =>
  Object.fromEntries(
    stickers.map((sticker, index) => {
      const persistedValue = initialValue?.[sticker.id];

      return [
        sticker.id,
        persistedValue ?? {
          ...sticker.initialValue,
          x: sticker.initialValue.x ?? randomizeCoordinate(),
          y: sticker.initialValue.y ?? randomizeCoordinate(),
          rotation: sticker.initialValue.rotation ?? parseRotationDegrees(sticker.geometry.rotation),
          zIndex: sticker.initialValue.zIndex ?? 1000 + index
        }
      ];
    })
  ) as StickerValueMap;
