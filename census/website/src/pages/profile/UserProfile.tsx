import { StickerValueMap } from '@/components/stickers';
import { Breadcrumbs } from '@/layouts/Breadcrumbs';
import { useUserProfile } from '@/services/api/users';
import { useSuspenseQuery } from '@tanstack/react-query';
import { FC } from 'react';
import { useParams } from 'react-router';
import { ProfileIdentificationFeed } from './ProfileIdentificationFeed';
import { ProfilePageLayout } from './ProfilePageLayout';
import { ProfileStickerStage } from './ProfileStickerStage';
import { useProfileStickers } from './useProfileStickers';

export const UserProfile: FC = () => {
  const { id } = useParams<{ id: string }>();

  const profile = useSuspenseQuery(useUserProfile(Number(id)));
  const stickers = useProfileStickers(profile.data, profile.data.user.id);

  return (
    <ProfilePageLayout>
      <Breadcrumbs>
        <p>home</p>
        <span>•</span>
        <p className="text-lg">{profile.data.user.username}</p>
      </Breadcrumbs>
      <ProfileStickerStage
        userId={profile.data.user.id}
        username={profile.data.user.username}
        stickers={stickers.data}
        initialValue={profile.data.user.stickers as StickerValueMap | undefined}
      />
      <ProfileIdentificationFeed userId={profile.data.user.id} />
    </ProfilePageLayout>
  );
};
