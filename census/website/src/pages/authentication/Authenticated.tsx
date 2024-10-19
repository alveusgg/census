import { useAuthentication } from '@/services/authentication/hooks';
import { PermissionsProvider } from '@/services/permissions/PermissionsProvider';
import { FC } from 'react';
import { Outlet } from 'react-router-dom';
import { NotAuthenticated } from './NotAuthenticated';

export const Authenticated: FC = () => {
  const account = useAuthentication(state => state.account);
  if (!account) return <NotAuthenticated />;

  return (
    <PermissionsProvider>
      <Outlet />
    </PermissionsProvider>
  );
};
