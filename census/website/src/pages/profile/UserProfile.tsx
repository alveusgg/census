import { useUserProfile } from '@/services/api/users';
import { useSuspenseQuery } from '@tanstack/react-query';
import { FC, useMemo } from 'react';
import { useParams } from 'react-router';
import { ProfileStickerStage } from './ProfileStickerStage';

export const UserProfile: FC = () => {
  const { id: idParam } = useParams<{ id: string }>();
  const id = useMemo(() => Number(idParam), [idParam]);

  const profile = useSuspenseQuery(useUserProfile(id));

  return (
    <div className="flex flex-col gap-6 mx-auto max-w-4xl w-full">
      <ProfileStickerStage username={profile.data.username} />
    </div>
  );
};
