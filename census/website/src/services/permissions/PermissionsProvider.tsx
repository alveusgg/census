import { FC, PropsWithChildren } from 'react';
import { usePermissions } from '../api/me';

export const PermissionsProvider: FC<PropsWithChildren> = ({ children }) => {
  usePermissions();

  return <>{children}</>;
};
