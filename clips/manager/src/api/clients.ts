import { z } from 'zod';
import { useDB } from '../../../../census/api/src/db/transaction';
import { clients } from '../db/schema';
import { procedure, router } from '../trpc/trpc';

export enum ClientPerms {
  Request = 'request',
  Provide = 'provide'
}

export default router({
  list: procedure.query(async () => {
    const db = useDB();
    return await db.query.clients.findMany();
  }),

  create: procedure
    .input(
      z
        .object({
          name: z.string(),
          contact: z.string(),
          perms: z.array(z.nativeEnum(ClientPerms))
        })
        .strict()
    )
    .mutation(async ({ input }) => {
      const db = useDB();
      const key = crypto.randomUUID();
      return await db
        .insert(clients)
        .values({ ...input, key })
        .returning();
    })
});
