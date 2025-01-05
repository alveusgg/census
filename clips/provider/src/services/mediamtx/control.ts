import { initContract as init } from '@ts-rest/core';
import { z } from 'zod';

const Path = z.object({
  name: z.string(),
  confName: z.string()
});

const Page = (item: z.ZodType) =>
  z.object({
    pageCount: z.number(),
    itemCount: z.number(),
    items: z.array(item)
  });

const c = init();
export const controlContract = c.router({
  paths: {
    method: 'GET',
    path: '/paths/list',
    responses: {
      200: Page(z.string())
    }
  }
});
