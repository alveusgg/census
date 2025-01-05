import { initContract as init } from '@ts-rest/core';
import { z } from 'zod';

const c = init();
export const playbackContract = c.router({
  list: {
    method: 'GET',
    path: '/list',
    query: z.object({
      path: z.string()
    }),
    responses: {
      200: z.array(
        z.object({
          start: z.string(),
          duration: z.number(),
          url: z.string()
        })
      )
    }
  },
  recording: {
    method: 'GET',
    path: '/get',
    query: z.object({
      path: z.string(),
      duration: z.number(),
      start: z.date().transform(d => d.toISOString()),
      format: z.enum(['mp4', 'fmp4']).optional()
    }),
    responses: {
      200: c.otherResponse({
        contentType: 'video/mp4',
        body: z.instanceof(Blob)
      })
    }
  }
});
