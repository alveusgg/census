import { config } from 'dotenv';
config();

import { input } from '@inquirer/prompts';
import { users } from '../db/schema/index.js';
import { createEnvironment } from '../utils/env/env.js';

const seed = async () => {
  const environment = await createEnvironment();
  const username = await input({
    message: 'What is your twitch username?'
  });

  await environment.db.insert(users).values({
    role: 'admin',
    username
  });
  console.log(`${username} has been added to the admin role.`);

  process.exit(0);
};

seed().catch(console.error);
