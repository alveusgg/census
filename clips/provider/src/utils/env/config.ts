import { initClient } from '@ts-rest/core';
import z from 'zod';
import { controlContract } from '../../services/mediamtx/control';
import { playbackContract } from '../../services/mediamtx/playback';
import { createClient } from '../../trpc';

export const config = z.object({
  NODE_ENV: z.enum(['development', 'production']),
  API_URL: z.string(),
  API_KEY: z.string(),
  MEDIAMTX_URL: z.string(),

  MEDIAMTX_PLAYBACK_PORT: z.number().default(9996),
  MEDIAMTX_CONTROL_PORT: z.number().default(9997),
  FEEDS: z
    .string()
    .transform(s => s.split(',').map(s => s.trim()))
    .refine(feeds => feeds.length > 0, 'FEEDS must be a comma separated list of feed ids')
});

export const services = async (variables: z.infer<typeof config>) => {
  // Create the TRPC client to the census api
  const api = createClient(variables.API_URL);

  // Create the client to mediamtx
  const playback = initClient(playbackContract, {
    baseUrl: `${variables.MEDIAMTX_URL}:${variables.MEDIAMTX_PLAYBACK_PORT}`
  });
  const mediamtx = initClient(controlContract, {
    baseUrl: `${variables.MEDIAMTX_URL}:${variables.MEDIAMTX_CONTROL_PORT}/v3`
  });

  return { api, mediamtx, playback };
};
