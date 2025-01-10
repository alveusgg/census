import { Permissions, usePermissions } from '../api/me';
export { usePermissions } from '../api/me';

export function useHasPermission(permission: keyof Permissions) {
  const permissions = usePermissions();
  return permissions.data[permission];
}
