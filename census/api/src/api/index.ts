import { router } from '../trpc/trpc.js';
import { createCaptureRouter } from './capture.js';
import { createFeedRouter } from './feed.js';
import { createGuidesRouter } from './guides.js';
import { createIdentificationRouter } from './identification.js';
import { createMeRouter } from './me.js';
import { createObservationRouter } from './observation.js';
import { createSeasonsRouter } from './seasons.js';
import { createTwitchRouter } from './twitch.js';
import { createUsersRouter } from './users.js';

export const createRouter = () =>
  router({
    me: createMeRouter(),
    feed: createFeedRouter(),
    capture: createCaptureRouter(),
    observation: createObservationRouter(),
    identification: createIdentificationRouter(),
    twitch: createTwitchRouter(),
    users: createUsersRouter(),
    seasons: createSeasonsRouter(),
    guides: createGuidesRouter()
  });
