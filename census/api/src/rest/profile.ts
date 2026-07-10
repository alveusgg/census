import { NotFoundError } from '@alveusgg/error';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getUserProfileSummary, UserProfileSummary } from '../services/users/profile.js';

const ProfileQuery = z.object({
  username: z
    .string()
    .trim()
    .min(1)
    .max(25)
    .regex(/^[a-zA-Z0-9_]+$/)
});

export const formatUserProfileSummary = (profile: UserProfileSummary) => {
  const points = new Intl.NumberFormat('en-US').format(profile.pointsLast7Days);
  return `${profile.username} [lvl ${profile.level.toString()}] [${points} pts ∙ last 7 days] [${profile.additional}]`;
};

export const createProfileRestRouter = () => async (router: FastifyInstance) => {
  router.get('/profile', async (request, reply) => {
    const query = ProfileQuery.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).type('text/plain; charset=utf-8').send('Invalid request, sorry!');
    }

    try {
      const profile = await getUserProfileSummary(query.data.username);
      return reply
        .header('Cache-Control', 'public, max-age=60')
        .type('text/plain; charset=utf-8')
        .send(formatUserProfileSummary(profile));
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply
          .status(404)
          .type('text/plain; charset=utf-8')
          .send("You haven't signed up yet! https://alveus.gg/census");
      }
      throw error;
    }
  });
};

export default createProfileRestRouter();
