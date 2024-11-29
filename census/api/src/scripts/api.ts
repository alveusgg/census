import { config } from 'dotenv';
config();

import { input } from '@inquirer/prompts';
import { feeds, users } from '../db/schema/index.js';
import { createEnvironment } from '../utils/env/env.js';

const seed = async () => {
  const environment = await createEnvironment();
  const username = await input({
    message: 'What is your twitch username?'
  });

  const twitchUserId = await input({
    message:
      'What is your twitch user id? Find it using https://www.streamweasels.com/tools/convert-twitch-username-%20to-user-id/'
  });

  await environment.db.insert(users).values({
    role: 'admin',
    username,
    twitchUserId
  });

  console.log(`${username} has been added to the admin role.`);
  console.log(`Setting up default development feed...`);

  await environment.db.insert(feeds).values({
    id: 'pollinator',
    key: 'pollinatorkey1',
    status: 'healthy'
  });

  console.log(`Default development feed has been setup.`);

  process.exit(0);
};

seed().catch(console.error);
