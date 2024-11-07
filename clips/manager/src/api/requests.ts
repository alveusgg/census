import { useDB } from '../../../../census/api/src/db/transaction';
import { procedure, router } from '../trpc/trpc';

export default router({
  list: procedure.query(async () => {
    const db = useDB();
    return await db.query.requests.findMany();
  })
});
