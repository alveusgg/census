import { AuthenticationTimeoutError, BadRequestError, CustomError } from '@alveusgg/error';
import { addMinutes, isAfter } from 'date-fns';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { useEnvironment } from '../../utils/env/env.js';
import { getOrCreateUserFromAuthProviderIdentity, updateUsername } from '../users/index.js';
import { AlveusAuthenticationMethodsProvider } from './methods/alveus.js';

const ProviderRedirectResponse = z.object({
  code: z.string(),
  state: z.string()
});

const SignInRequest = z.object({
  from: z.string().optional(),
  origin: z.string()
});

const RefreshTokenRequest = z.object({
  refreshToken: z.string()
});

const SignInMeta = z.object({
  from: z.string().optional(),
  origin: z.string(),
  expires: z.coerce.date()
});

type SignInMeta = z.infer<typeof SignInMeta>;

export const TokenPayload = z.object({
  sub: z.string(),
  roles: z.array(z.enum(['census_moderator', 'census_admin']).or(z.string()))
});

export type TokenPayload = z.infer<typeof TokenPayload>;

export default async function register(router: FastifyInstance) {
  router.get('/signin', async (request, reply) => {
    const { host } = useEnvironment();

    const { from, origin } = SignInRequest.parse(request.query);

    const state: SignInMeta = { expires: addMinutes(new Date(), 10), origin };
    if (from) state.from = from;

    const url = await AlveusAuthenticationMethodsProvider.createSignInRequest(
      `${host}/auth/redirect`,
      JSON.stringify(state)
    );
    return reply.redirect(url);
  });

  router.post('/refresh', async (request, reply) => {
    const { refreshToken } = RefreshTokenRequest.parse(request.body);
    const tokens = await AlveusAuthenticationMethodsProvider.refreshToken(refreshToken);
    return reply.status(200).send(tokens);
  });

  router.get('/redirect', async (request, reply) => {
    const { host } = useEnvironment();
    const query = ProviderRedirectResponse.parse(request.query);

    const token = await AlveusAuthenticationMethodsProvider.exchangeCodeForToken(
      `${host}/auth/redirect`,
      query.code,
      query.state
    );

    const meta = parseState(token.state);
    if (isAfter(new Date(), meta.expires)) throw new AuthenticationTimeoutError('Login expired.');

    try {
      const identity = await AlveusAuthenticationMethodsProvider.getUserInformation(token.accessToken);
      const user = await getOrCreateUserFromAuthProviderIdentity(identity.id, identity.username);
      if (user.username !== identity.username) {
        await updateUsername(user.id, identity.username);
      }

      const params = new URLSearchParams();
      params.set('access_token', token.accessToken);
      params.set('refresh_token', token.refreshToken);
      if (meta.from) params.set('from', meta.from);

      return reply.redirect(`${meta.origin}/auth/redirect#${params.toString()}`);
    } catch (error) {
      if (error instanceof CustomError) {
        return reply.redirect(
          `${meta.origin}/auth/error?type=CustomError&error=${encodeURIComponent(JSON.stringify(error.toJSON()))}`
        );
      }
      if (error instanceof Error) {
        return reply.redirect(`${meta.origin}/auth/error?type=UnhandledError&message=${error.message}`);
      }
      return reply.redirect(`${meta.origin}/auth/error?type=UnknownError`);
    }
  });
}

const parseState = (state: string) => {
  try {
    return SignInMeta.parse(JSON.parse(state));
  } catch {
    throw new BadRequestError('You are trying to complete a login that was never started.');
  }
};
