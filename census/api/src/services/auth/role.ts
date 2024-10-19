import { eq } from 'drizzle-orm';
import { roles } from '../../db/schema/index.js';
import { useEnvironment } from '../../utils/env/env.js';

export const getPermissions = async (userId: string) => {
  const env = useEnvironment();
  const [role] = await env.db.select().from(roles).where(eq(roles.username, userId));

  const permissions = {
    editor: false,
    moderator: false,
    administrate: false
  };

  if (!role) return permissions;

  if (role.role === 'admin') {
    permissions.editor = true;
    permissions.moderator = true;
    permissions.administrate = true;

    return permissions;
  }

  if (role.role === 'moderator') {
    permissions.editor = true;
    permissions.moderator = true;
    return permissions;
  }

  if (role.role === 'capturer') {
    permissions.editor = true;
    return permissions;
  }

  return permissions;
};
