import { StickerSpec } from '@/components/stickers';
import { hasLevelArtworkAsset, loadLevelArtwork } from '@/lib/levels';
import type { UserProfile as UserProfileData } from '@/services/api/users';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createSticker, parseSilhouette } from './ProfileStickerStage';

const silhouettesAvailableInAssets = import.meta.glob('/src/assets/*.silhouette.svg', {
  query: '?raw',
  import: 'default'
});

export const useProfileStickers = (profile: UserProfileData, userId: number) => {
  return useSuspenseQuery({
    queryKey: ['stickers', userId],
    queryFn: async () => {
      const live = await Promise.all(
        profile.levels
          .filter(level => 'sticker' in level)
          .filter(level => {
            const silhouette = `/src/assets/${level.sticker.silhouette.name}`;
            return hasLevelArtworkAsset(level) && silhouette in silhouettesAvailableInAssets;
          })
          .map(async level => {
            const imageSrc = await loadLevelArtwork(level);
            const silhouetteSrc = await silhouettesAvailableInAssets[`/src/assets/${level.sticker.silhouette.name}`]();

            const scale = 'scale' in level.sticker ? level.sticker.scale : 1;

            if (typeof silhouetteSrc !== 'string' || !imageSrc) {
              throw new Error('Silhouette or image in the correct format.');
            }

            const silhouette = parseSilhouette(silhouetteSrc);

            return createSticker({
              id: `level-${level.number}`,
              label: level.name,
              imageSrc,
              silhouette,
              width: silhouette.width * 0.1 * scale,
              height: silhouette.height * 0.1 * scale,
              rotation: '0deg'
            });
          })
      );

      return [...live] satisfies StickerSpec[];
    }
  });
};
