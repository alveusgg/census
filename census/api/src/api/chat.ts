import { status } from '../services/chat/index.js';
import { moderatorProcedure, router } from '../trpc/trpc.js';

export default router({
  status: moderatorProcedure.query(async () => {
    return status;
  })
});
