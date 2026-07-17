import { StickerValueMap } from '@/components/stickers';
import { Breadcrumbs } from '@/layouts/Breadcrumbs';
import { PageTitle } from '@/lib/meta';
import { useMe } from '@/services/api/me';
import { useUserProfile } from '@/services/api/users';
import { key, useAPI } from '@/services/query/hooks';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { FC } from 'react';
import { ProfileIdentificationFeed } from './ProfileIdentificationFeed';
import { ProfilePageLayout } from './ProfilePageLayout';
import { ProfileStickerStage } from './ProfileStickerStage';
import { useProfileStickers } from './useProfileStickers';

export const MyProfile: FC = () => {
  const me = useSuspenseQuery(useMe());
  const profile = useSuspenseQuery(useUserProfile(me.data.id));

  const api = useAPI();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (positions: StickerValueMap) => {
      await api.users.updateStickerPositions.mutate({ positions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key('users') });
    }
  });

  const stickers = useProfileStickers(profile.data, me.data.id);

  const handleChange = (positions: StickerValueMap) => {
    mutation.mutate(positions);
  };

  return (
    <ProfilePageLayout>
      <PageTitle title={`${me.data.username}'s Profile`} />
      <Breadcrumbs>
        <p>home</p>
        <span>•</span>
        <p className="text-lg">{me.data.username}</p>
      </Breadcrumbs>
      <ProfileStickerStage
        userId={me.data.id}
        username={me.data.username}
        editable
        stickers={stickers.data}
        initialValue={profile.data.user.stickers as StickerValueMap | undefined}
        onChange={handleChange}
      />
      <ProfileIdentificationFeed userId={me.data.id} />
    </ProfilePageLayout>
  );
};
