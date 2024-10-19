import { addSeconds, subSeconds } from 'date-fns';
import { eq } from 'drizzle-orm';
import { captures } from '../../db/schema/index.js';
import { useEnvironment } from '../../utils/env/env.js';

export const createCaptureRequest = async (feedId: string, username: string, duration: number, rewind: number) => {
  const { db } = useEnvironment();
  const startCaptureAt = subSeconds(new Date(), rewind);
  const endCaptureAt = addSeconds(startCaptureAt, duration);
  const [request] = await db
    .insert(captures)
    .values({
      feedId,
      capturedAt: new Date(),
      capturedBy: username,
      startCaptureAt,
      endCaptureAt
    })
    .returning();
  return request;
};

export const getCapture = async (id: number) => {
  const { db } = useEnvironment();
  const [request] = await db.select().from(captures).where(eq(captures.id, id));
  return request;
};

export const processingCaptureRequest = async (id: number) => {
  const { db } = useEnvironment();
  await db.update(captures).set({ status: 'processing' }).where(eq(captures.id, id));
};

export const completeCaptureRequest = async (id: number, videoUrl: string) => {
  const { db } = useEnvironment();
  await db.update(captures).set({ status: 'complete', videoUrl }).where(eq(captures.id, id));
};
