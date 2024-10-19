import { z } from 'zod';
import { useEnvironment } from '../../../utils/env/env.js';

const TwitchAccessToken = z.object({
  accessToken: z.string(),
  refreshToken: z.string().nullable(),
  expiresIn: z.number().nullable(),
  scope: z.array(z.string()),
  obtainmentTimestamp: z.number()
});

export const saveToken = async (token: z.infer<typeof TwitchAccessToken>) => {
  const env = useEnvironment();
  await env.redis.set('twitch:token', JSON.stringify(token));
};

export const restoreToken = async () => {
  const env = useEnvironment();
  const token = await env.redis.get('twitch:token');
  if (!token) return;

  const parsed = TwitchAccessToken.safeParse(JSON.parse(token));
  if (!parsed.success) {
    console.warn(`Invalid token in redis: ${token}`);
    return;
  }
  return parsed.data;
};
