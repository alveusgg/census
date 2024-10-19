import { config } from 'dotenv';
config();

import { feeds } from '../db/schema/index.js';
import { createEnvironment } from '../utils/env/env.js';

const seed = async () => {
  const environment = await createEnvironment();
  const [feed] = await environment.db
    .insert(feeds)
    .values({
      id: 'twitch',
      key: 'running-locally-key'
    })
    .returning();

  console.log(`Created feed for local ingest server:\nFEED_ID=${feed.id}\nFEED_KEY=${feed.key}`);
};

seed().catch(console.error);
