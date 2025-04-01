import { AuthenticationTimeoutError, BadRequestError, CustomError, NotAuthenticatedError } from '@alveusgg/error';
import { isAfter } from 'date-fns';
import { FastifyInstance } from 'fastify';
import { TimeSpan } from 'oslo';
import { createJWT } from 'oslo/jwt';
import { z } from 'zod';
import { useEnvironment } from '../../utils/env/env.js';
import { getOrCreateUserFromTwitchId, updateUsername } from '../users/index.js';
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

const SignInMeta = z.object({
  key: z.string(),
  from: z.string().optional(),
  origin: z.string(),
  expires: z.coerce.date()
});

type SignInMeta = z.infer<typeof SignInMeta>;

export const TokenPayload = z.object({
  id: z.coerce.number(),
  twitchUserId: z.string(),
  twitchUsername: z.string()
});

export type TokenPayload = z.infer<typeof TokenPayload>;

export default async function register(router: FastifyInstance) {
  router.get('/signin', async (request, reply) => {
    const { cache } = useEnvironment();
    const key = crypto.randomUUID();

    const { from, origin } = SignInRequest.parse(request.query);

    const state: SignInMeta = { key, expires: new Date(), origin };
    if (from) state.from = from;

    await cache.set(key, JSON.stringify(state));
    const url = createSignInRequest('/auth/redirect', key);
    return reply.redirect(url);
  });

  router.get('/redirect', async (request, reply) => {
    const { variables, cache } = useEnvironment();
    const query = TwitchRedirectResponse.parse(request.query);

    const state = await cache.get(query.state);
    if (!state) throw new BadRequestError('You are trying to complete a login that was never started.');
    const { from, origin, expires } = SignInMeta.parse(JSON.parse(state));

    try {
      if (isAfter(expires, new Date())) throw new AuthenticationTimeoutError('Login expired.');

      const token = await exchangeCodeForToken('/auth/redirect', query.code);
      if (!(await validateToken(token.accessToken))) {
        throw new NotAuthenticatedError('Invalid token');
      }
      const { id, login } = await getUserInformation(token.accessToken);
      const user = await getOrCreateUserFromTwitchId(id, login);
      if (user.username !== login) {
        await updateUsername(user.id, login);
      }

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
      await cache.delete(query.state);

      return reply.redirect(`${origin}/auth/redirect?${params.toString()}`);
    } catch (error) {
      if (error instanceof CustomError) {
        return reply.redirect(
          `${origin}/auth/error?type=CustomError&error=${encodeURIComponent(JSON.stringify(error.toJSON()))}`
        );
      }
      if (error instanceof Error) {
        return reply.redirect(`${origin}/auth/error?type=UnhandledError&message=${error.message}`);
      }
      return reply.redirect(`${origin}/auth/error?type=UnknownError`);
    }
  });
}
