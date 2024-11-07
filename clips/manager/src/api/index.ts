import { procedure, router } from '../trpc/trpc.js';

export default router({
  test: procedure.query(() => 'test')
});
