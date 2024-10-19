import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { useEnvironment } from '../../../utils/env/env.js';
import { createSignInRequest, exchangeCodeForToken, getUserInformation, validateToken } from '../../auth/auth.js';
import { start, status } from '../index.js';
import { saveToken } from './token.js';

const TwitchRedirectResponse = z.object({
  code: z.string(),
  scope: z.string()
});

export default async function register(router: FastifyInstance) {
  router.get('/admin/signin', async (_, reply) => {
    const url = createSignInRequest('/admin/redirect', crypto.randomUUID());
    return reply.redirect(url);
  });

  router.get('/admin/redirect', async (request, reply) => {
    const env = useEnvironment();
    const query = TwitchRedirectResponse.parse(request.query);
    const token = await exchangeCodeForToken('/admin/redirect', query.code);
    if (!(await validateToken(token.accessToken))) {
      throw new Error('Invalid token');
    }

    const user = await getUserInformation(token.accessToken);
    if (user.login !== env.variables.TWITCH_USERNAME) {
      throw new Error('Invalid user');
    }

    await saveToken(token);

    if (status.status === 'offline:not_authenticated') {
      await start();
    }
    return reply.send(`Thank you for signing in!`);
  });
}
