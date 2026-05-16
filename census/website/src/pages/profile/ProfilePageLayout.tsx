import { FC, PropsWithChildren } from 'react';

export const ProfilePageLayout: FC<PropsWithChildren> = ({ children }) => {
  return <div className="mx-auto flex w-full flex-col gap-6">{children}</div>;
};
