import { useMe } from '@/services/api/me';
import { useSuspenseQuery } from '@tanstack/react-query';
import { FC } from 'react';
import { ProfileStickerStage } from './ProfileStickerStage';

export const MyProfile: FC = () => {
  const me = useSuspenseQuery(useMe());

  return (
    <div className="flex flex-col gap-6 mx-auto max-w-4xl w-full">
      <ProfileStickerStage username={me.data.username} editable />
    </div>
  );
};
