import { useContext } from 'react';
import { useStore } from 'zustand';
import { PermissionsContext, PermissionsStore } from './PermissionsProvider';

export function usePermissionsStore<U>(selector: (store: PermissionsStore) => U): U {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return useStore(context, selector);
}

export function usePermissions() {
  return usePermissionsStore(state => state.permissions);
}
