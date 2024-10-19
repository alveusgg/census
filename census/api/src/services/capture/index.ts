import { eq } from 'drizzle-orm';
import { BoundingBox, captures } from '../../db/schema/index.js';
import { useEnvironment } from '../../utils/env/env.js';

interface Images {
  url: string;
  boundingBoxes: BoundingBox[];
}

interface CreateCaptureInput {
  snapshotId: number;
  images: Images[];
  name?: string;
}

export const createCapture = async (input: CreateCaptureInput) => {
  // const { db } = useEnvironment();
  // const snapshot = await db.query.snapshots.findFirst({
  //   where: eq(snapshots.id, input.snapshotId)
  // });
  // if (!snapshot) throw new Error('Snapshot not found');
  // return await db.transaction(async tx => {
  //   const [capture] = await tx
  //     .insert(captures)
  //     .values({
  //       createdAt: snapshot.createdAt,
  //       createdBy: snapshot.createdBy,
  //       name: input.name
  //     })
  //     .returning();
  //   await tx
  //     .insert(images)
  //     .values(
  //       input.images.map(image => ({ url: image.url, captureId: capture.id, boundingBoxes: image.boundingBoxes }))
  //     );
  //   await tx.update(snapshots).set({ captureId: capture.id }).where(eq(snapshots.id, input.snapshotId));
  //   return capture;
  // });
};

export const getCapture = async (id: number) => {
  const { db } = useEnvironment();
  const capture = await db.query.captures.findFirst({
    where: eq(captures.id, id)
  });
  if (!capture) throw new Error('Capture not found');
  return capture;
};
