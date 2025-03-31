import unfurl from 'unfurl.js';
import z from 'zod';
import {
  getDocumentById,
  getGuideById,
  getGuideBySlug,
  publishGuide,
  updateDocument
} from '../services/guides/index.js';
import { procedure, publicProcedure, router } from '../trpc/trpc.js';

export default router({
  document: {
    getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
      return await getDocumentById(input.id);
    }),
    update: publicProcedure.input(z.object({ id: z.string(), snapshot: z.any() })).mutation(async ({ input }) => {
      await updateDocument(input.id, input.snapshot);
    })
  },
  guide: {
    getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      return await getGuideBySlug(input.slug);
    }),
    getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
      return await getGuideById(input.id);
    }),
    publish: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
      return await publishGuide(input.id);
    })
  },
  utils: {
    unfurl: procedure.input(z.object({ url: z.string() })).query(async ({ input }) => {
      const { title, description, open_graph, twitter_card, favicon } = await unfurl.unfurl(input.url);
      const image = open_graph?.images?.[0]?.url || twitter_card?.images?.[0]?.url;

      return {
        title,
        description,
        image,
        favicon
      };
    })
  }
});
