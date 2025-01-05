import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { images, observations } from '../../db/schema/index.js';
import { useDB } from '../../db/transaction.js';
import { useEnvironment, useUser } from '../../utils/env/env.js';

const Post = z.object({
  id: z.string()
});

interface DiscordWebhookPayload {
  content: string;
  embeds: {
    url: string;
    title: string;
    image: {
      url: string;
    };
  }[];
  thread_name?: string;
}

export const notifyDiscordAboutObservation = async (observationId: number) => {
  const { variables, host } = useEnvironment();
  const db = useDB();
  const user = useUser();

  if (!variables.DISCORD_WEBHOOK_URL) {
    console.warn(`Unable to create forum post, no webhook URL found in environment.`);
    return;
  }

  const url = new URL(variables.DISCORD_WEBHOOK_URL);
  url.searchParams.set('wait', 'true');

  const image = await db.query.images.findFirst({
    where: eq(images.observationId, observationId)
  });

  if (!image) {
    console.error(`No image found for observation ${observationId}`);
    return;
  }

  const payload: DiscordWebhookPayload = {
    content: `${user.twitchUsername} has asked for help on this ID`,
    embeds: [
      {
        url: `https://alveuspollinatorcensus.org/o/${observationId}`,
        title: 'Open observation in Alveus Pollinator Census',
        image: {
          url: `${host}/preview/observation/${observationId}`
        }
      }
    ]
  };

  if (variables.DISCORD_IS_FORUM) {
    payload.thread_name = 'ID help request';
  }

  console.log(`url: ${url.toString()}, payload: ${JSON.stringify(payload)}`);

  const response = await fetch(url.toString(), {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    console.error(`Failed to create forum post: ${response.statusText}`);
    console.error(await response.text());
    return;
  }

  console.log(`Forum post created successfully`);
  const post = Post.parse(await response.json());
  await db.update(observations).set({ discordThreadId: post.id }).where(eq(observations.id, observationId));
};
