import { CustomError } from '@alveusgg/error';
import { FastifyInstance } from 'fastify';
import { TimeSpan } from 'oslo';
import { createJWT } from 'oslo/jwt';
import { z } from 'zod';
import { useEnvironment } from '../../utils/env/env.js';
import { getUserFromTwitchId } from '../users/index.js';
import { createSignInRequest, exchangeCodeForToken, getUserInformation, validateToken } from './auth.js';

const TwitchRedirectResponse = z.object({
  code: z.string(),
  scope: z.string(),
  state: z.string()
});

const SignInRequest = z.object({
  from: z.string().optional(),
  origin: z.string()
});
const cache = new Map<string, string>();

export const TokenPayload = z.object({
  id: z.coerce.number(),
  twitchUserId: z.string(),
  twitchUsername: z.string()
});

export type TokenPayload = z.infer<typeof TokenPayload>;

export default async function register(router: FastifyInstance) {
  router.get('/auth/signin', async (request, reply) => {
    const key = crypto.randomUUID();
    const state: { key: string; from?: string; origin?: string } = { key };

    const { from, origin } = SignInRequest.parse(request.query);
    if (from) state.from = from;
    if (origin) state.origin = origin;

    cache.set(key, JSON.stringify(state));

    const url = createSignInRequest('/auth/redirect', key);
    return reply.redirect(url);
  });

  router.get('/auth/redirect', async (request, reply) => {
    const { variables } = useEnvironment();
    const query = TwitchRedirectResponse.parse(request.query);

    const state = cache.get(query.state);
    if (!state) throw new Error('Login expired or invalid.');

    const token = await exchangeCodeForToken('/auth/redirect', query.code);
    if (!(await validateToken(token.accessToken))) {
      throw new Error('Invalid token');
    }
    const { from, origin } = SignInRequest.parse(JSON.parse(state));
    try {
      const { id, login } = await getUserInformation(token.accessToken);
      const user = await getUserFromTwitchId(id);

      const payload: TokenPayload = {
        id: user.id,
        twitchUserId: id,
        twitchUsername: login
      };

      const jwt = await createJWT('HS256', variables.JWT_SECRET, payload, {
        expiresIn: new TimeSpan(30, 'd'),
        subject: user.id.toString()
      });

      const params = new URLSearchParams();
      params.set('token', jwt);

      if (from) params.set('from', from);
      cache.delete(query.state);

      return reply.redirect(`${origin}/auth/redirect?${params.toString()}`);
    } catch (error) {
      if (error instanceof CustomError) {
        return reply.redirect(`${origin}/auth/error?type=${error.name}&message=${error.message}`);
      }
      if (error instanceof Error) {
        return reply.redirect(`${origin}/auth/error?type=UnhandledError&message=${error.message}`);
      }
      return reply.redirect(`${origin}/auth/error?type=UnknownError`);
    }
  });
}
