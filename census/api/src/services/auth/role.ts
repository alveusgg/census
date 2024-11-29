import { eq } from 'drizzle-orm';
import { users } from '../../db/schema/index.js';
import { useEnvironment } from '../../utils/env/env.js';

export const getPermissions = async (userId: number) => {
  const env = useEnvironment();
  const [user] = await env.db.select().from(users).where(eq(users.id, userId));

  const permissions = {
    editor: false,
    moderator: false,
    administrate: false
  };

  if (!user) return permissions;

  if (user.role === 'admin') {
    permissions.editor = true;
    permissions.moderator = true;
    permissions.administrate = true;

    return permissions;
  }

  if (user.role === 'moderator') {
    permissions.editor = true;
    permissions.moderator = true;
    return permissions;
  }

  if (user.role === 'capturer') {
    permissions.editor = true;
    return permissions;
  }

  return permissions;
};
