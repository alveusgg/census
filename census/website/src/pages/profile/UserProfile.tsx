import { useUserProfile } from '@/services/api/users';
import { useSuspenseQuery } from '@tanstack/react-query';
import { FC } from 'react';
import { useParams } from 'react-router';
import { ProfileStickerStage } from './ProfileStickerStage';

export const UserProfile: FC = () => {
  const { id } = useParams<{ id: string }>();

  const profile = useSuspenseQuery(useUserProfile(Number(id)));

  return (
    <div className="flex flex-col gap-6 mx-auto max-w-4xl w-full">
      <ProfileStickerStage username={profile.data.user.username} />
    </div>
  );
};
