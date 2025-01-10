import { eq } from 'drizzle-orm';
import { users } from '../../db/schema/index.js';
import { useEnvironment } from '../../utils/env/env.js';

export type Permissions = {
  vote: boolean;
  suggest: boolean;
  capture: boolean;
  confirm: boolean;
  research: boolean;
  admin: boolean;
  moderate: boolean;
};

export const getPermissions = async (userId: number) => {
  const env = useEnvironment();
  const [user] = await env.db.select().from(users).where(eq(users.id, userId));

  const permissions = {
    vote: false,
    suggest: false,
    capture: false,
    confirm: false,
    research: false,
    admin: false,
    moderate: false
  };

  if (!user) return permissions;

  if (user.role === 'pending') {
    return permissions;
  }

  if (user.role === 'admin') {
    permissions.vote = true;
    permissions.capture = true;
    permissions.confirm = true;
    permissions.research = true;
    permissions.admin = true;
    permissions.moderate = true;
    permissions.suggest = true;
    return permissions;
  }

  if (user.role === 'moderator') {
    permissions.vote = true;
    permissions.capture = true;
    permissions.confirm = true;
    permissions.research = true;
    permissions.moderate = true;
    permissions.suggest = true;
    return permissions;
  }

  if (user.role === 'expert') {
    permissions.vote = true;
    permissions.capture = true;
    permissions.confirm = true;
    permissions.research = true;
    permissions.suggest = true;
    return permissions;
  }

  if (user.role === 'capturer') {
    permissions.vote = true;
    permissions.capture = true;
    permissions.suggest = true;
    return permissions;
  }

  if (user.role === 'researcher') {
    permissions.vote = true;
    permissions.suggest = true;
    permissions.research = true;
    return permissions;
  }

  if (user.role === 'member') {
    permissions.vote = true;
    permissions.suggest = true;
    return permissions;
  }

  return permissions;
};
