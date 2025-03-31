import { useSuspenseQuery } from '@tanstack/react-query';
import { Permissions, usePermissions } from '../api/me';
export { usePermissions } from '../api/me';

export function useHasPermission(permission: keyof Permissions) {
  const query = usePermissions();
  const permissions = useSuspenseQuery(query);
  return permissions.data[permission];
}
