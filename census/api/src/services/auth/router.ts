import { FastifyInstance } from 'fastify';
import { TimeSpan } from 'oslo';
import { createJWT } from 'oslo/jwt';
import { z } from 'zod';
import { useEnvironment } from '../../utils/env/env.js';
import { createSignInRequest, exchangeCodeForToken, getUserInformation, validateToken } from './auth.js';

const TwitchRedirectResponse = z.object({
  code: z.string(),
  scope: z.string(),
  state: z.string()
});

const SignInRequest = z.object({
  from: z.string().optional()
});
const cache = new Map<string, string>();

export default async function register(router: FastifyInstance) {
  router.get('/auth/signin', async (request, reply) => {
    const key = crypto.randomUUID();
    const state: { key: string; from?: string } = { key };

    const { from } = SignInRequest.parse(request.query);
    if (from) state.from = from;

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
    const { from } = SignInRequest.parse(JSON.parse(state));

    const user = await getUserInformation(token.accessToken);
    const jwt = await createJWT(
      'HS256',
      variables.JWT_SECRET,
      {},
      { expiresIn: new TimeSpan(30, 'd'), subject: user.login }
    );

    const params = new URLSearchParams();
    params.set('token', jwt);

    if (from) params.set('from', from);
    cache.delete(query.state);

    return reply.redirect(`${variables.UI_URL}/auth/redirect?${params.toString()}`);
  });
}
