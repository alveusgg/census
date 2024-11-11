import { router } from '../trpc/trpc.js';
import capture from './capture.js';
import feed from './feed.js';
import identification from './identification.js';
import me from './me.js';
import observation from './observation.js';
import twitch from './twitch.js';
export default router({
  me,
  feed,
  capture,
  observation,
  identification,
  twitch
});
