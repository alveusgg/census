import { getPermissions } from '../services/auth/role.js';
import { procedure, router } from '../trpc/trpc.js';
import { useUser } from '../utils/env/env.js';

export default router({
  permissions: procedure.query(async () => {
    const user = useUser();
    return getPermissions(user.id);
  })
});
