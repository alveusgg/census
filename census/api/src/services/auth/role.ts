import { useUser } from '../../utils/env/env.js';

export type Permissions = {
  vote: boolean;
  suggest: boolean;
  capture: boolean;
  confirm: boolean;
  research: boolean;
  admin: boolean;
  moderate: boolean;
};

export const getPermissions = async () => {
  const { roles, status } = useUser();

  const permissions = {
    vote: false,
    suggest: false,
    capture: false,
    confirm: false,
    research: false,
    admin: false,
    moderate: false
  };

  if (status === 'pending') {
    return permissions;
  }

  if (roles.includes('census_admin')) {
    permissions.vote = true;
    permissions.capture = true;
    permissions.confirm = true;
    permissions.research = true;
    permissions.admin = true;
    permissions.moderate = true;
    permissions.suggest = true;
    return permissions;
  }

  if (roles.includes('census_moderator')) {
    permissions.vote = true;
    permissions.capture = true;
    permissions.confirm = true;
    permissions.research = true;
    permissions.moderate = true;
    permissions.suggest = true;
    return permissions;
  }

  permissions.vote = true;
  permissions.capture = true;
  permissions.suggest = true;
  return permissions;
};
