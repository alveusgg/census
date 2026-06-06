import unfurl from 'unfurl.js';
import z from 'zod';
import {
  getDocumentById,
  getGuideById,
  getGuideBySlug,
  getPublishedGuides,
  publishGuide,
  updateDocument
} from '../services/guides/index.js';
import { cache, procedure, publicProcedure, router } from '../trpc/trpc.js';

export default router({
  document: {
    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .use(
        cache.query({
          key: ({ input }) => ['guides', 'document', input.id],
          ttl: 60
        })
      )
      .query(async ({ input }) => {
        return await getDocumentById(input.id);
      }),
    update: publicProcedure
      .input(z.object({ id: z.string(), snapshot: z.any() }))
      .use(
        cache.mutation({
          keys: ({ input }) => [
            ['guides', 'document', input.id],
            ['guides', 'guide']
          ]
        })
      )
      .mutation(async ({ input }) => {
        await updateDocument(input.id, input.snapshot);
      })
  },
  guide: {
    getPublished: publicProcedure
      .use(cache.query({ key: ['guides', 'guide', 'published'], ttl: 60 }))
      .query(async () => {
        return await getPublishedGuides();
      }),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .use(
        cache.query({
          key: ({ input }) => ['guides', 'guide', 'slug', input.slug],
          ttl: 60
        })
      )
      .query(async ({ input }) => {
        return await getGuideBySlug(input.slug);
      }),
    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .use(
        cache.query({
          key: ({ input }) => ['guides', 'guide', 'id', input.id],
          ttl: 60
        })
      )
      .query(async ({ input }) => {
        return await getGuideById(input.id);
      }),
    publish: publicProcedure
      .input(z.object({ id: z.string() }))
      .use(
        cache.mutation({
          keys: [
            ['guides', 'guide'],
            ['guides', 'document']
          ]
        })
      )
      .mutation(async ({ input }) => {
        return await publishGuide(input.id);
      })
  },
  utils: {
    unfurl: procedure
      .input(z.object({ url: z.string() }))
      .use(cache.query({ key: ({ input }) => ['guides', 'utils', 'unfurl', input.url], ttl: 60 * 60 }))
      .query(async ({ input }) => {
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
