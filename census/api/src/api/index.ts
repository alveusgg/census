import { router } from '../trpc/trpc.js';
import capture from './capture.js';
import chat from './chat.js';
import feed from './feed.js';
import me from './me.js';
import observation from './observation.js';

export default router({
  me,
  feed,
  capture,
  chat,
  observation
});
