import { useMe } from "@/services/api/me";
import { useUserProfile } from "@/services/api/users";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { FC } from "react";
import {
  createSticker,
  parseSilhouette,
  ProfileStickerStage,
} from "./ProfileStickerStage";

import { StickerSpec, StickerValueMap } from "@/components/stickers";
import { hasLevelArtworkAsset, loadLevelArtwork } from "@/lib/levels";
import { useAPI } from "@/services/query/hooks";

const silhouettesAvailableInAssets = import.meta.glob(
  "/src/assets/*.silhouette.svg",
  {
    query: "?raw",
    import: "default",
  },
);

export const MyProfile: FC = () => {
  const me = useSuspenseQuery(useMe());
  const profile = useSuspenseQuery(useUserProfile(me.data.id));

  const api = useAPI();
  const mutation = useMutation({
    mutationFn: async (positions: StickerValueMap) => {
      await api.users.updateStickerPositions.mutate({ positions });
    },
  });

  const stickers = useSuspenseQuery({
    queryKey: ["stickers", me.data.id],
    queryFn: async () => {
      const live = await Promise.all(
        profile.data.levels
          .filter((level) => "sticker" in level)
          .filter((level) => {
            const silhouette = `/src/assets/${level.sticker.silhouette.name}`;
            return (
              hasLevelArtworkAsset(level) &&
              silhouette in silhouettesAvailableInAssets
            );
          })
          .map(async (level) => {
            const imageSrc = await loadLevelArtwork(level);
            const silhouetteSrc =
              await silhouettesAvailableInAssets[
                `/src/assets/${level.sticker.silhouette.name}`
              ]();

            const scale = "scale" in level.sticker ? level.sticker.scale : 1;

            if (typeof silhouetteSrc !== "string" || !imageSrc)
              throw new Error("Silhouette or image in the correct format.");
            const silhouette = parseSilhouette(silhouetteSrc);

            return createSticker({
              id: `level-${level.number}`,
              label: level.name,
              imageSrc,
              silhouette,
              width: silhouette.width * 0.1 * scale,
              height: silhouette.height * 0.1 * scale,
              rotation: "0deg",
            });
          }),
      );

      return [...live] satisfies StickerSpec[];
    },
  });

  const handleChange = (positions: StickerValueMap) => {
    mutation.mutate(positions);
  };

  return (
    <div className="flex flex-col gap-6 mx-auto w-full">
      <ProfileStickerStage
        username={me.data.username}
        editable
        stickers={stickers.data}
        initialValue={profile.data.user.stickers as StickerValueMap | undefined}
        onChange={handleChange}
      />
      <pre className="text-xs">{JSON.stringify(profile.data, null, 2)}</pre>
    </div>
  );
};
