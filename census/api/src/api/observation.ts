import { z } from 'zod';
import { getTaxaFromPartialSearch } from '../services/inat/index.js';
import { editorProcedure, router } from '../trpc/trpc.js';

export default router({
  search: editorProcedure
    .input(
      z.object({
        search: z.string()
      })
    )
    .query(async ({ input }) => {
      return await getTaxaFromPartialSearch(input.search);
    })
});
