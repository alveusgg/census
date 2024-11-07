import { createContext, FC, PropsWithChildren, useRef } from 'react';
import { createStore, StoreApi } from 'zustand';
import { usePermissions } from '../api/me';

interface Permissions {
  editor: boolean;
  moderator: boolean;
  administrate: boolean;
}

export interface PermissionsStore {
  permissions: Permissions;
}

export const PermissionsContext = createContext<StoreApi<PermissionsStore> | null>(null);

export const PermissionsProvider: FC<PropsWithChildren> = ({ children }) => {
  const permissions = usePermissions();

  const store = useRef(
    createStore<PermissionsStore>(() => ({
      permissions: permissions.data
    }))
  );

  return <PermissionsContext.Provider value={store.current}>{children}</PermissionsContext.Provider>;
};
