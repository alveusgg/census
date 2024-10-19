import { useSuspenseQuery } from '@tanstack/react-query';
import { createContext, FC, PropsWithChildren, useRef } from 'react';
import { createStore, StoreApi } from 'zustand';
import { key, useAPI } from '../query/hooks';

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
  const api = useAPI();

  const permissions = useSuspenseQuery({
    queryKey: key('permissions'),
    queryFn: () => api.me.permissions.query()
  });

  const store = useRef(
    createStore<PermissionsStore>(() => ({
      permissions: permissions.data
    }))
  );

  return <PermissionsContext.Provider value={store.current}>{children}</PermissionsContext.Provider>;
};
