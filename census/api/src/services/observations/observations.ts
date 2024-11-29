import { count, desc, eq } from 'drizzle-orm';
import { ReadableStream } from 'node:stream/web';
import { Readable } from 'stream';
import { BoundingBox, images, observations } from '../../db/schema';
import { useDB, withTransaction } from '../../db/transaction';
import { getTemporaryFile, TemporaryFile } from '../../utils/tmp';
import { getCapture } from '../capture';

const Selection = z.object({
  timestamp: z.number(),
  boundingBox: BoundingBox
});

export type Selection = z.infer<typeof Selection>;

export const ObservationPayload = z.array(Selection);

export type ObservationPayload = z.infer<typeof ObservationPayload>;

export const getObservation = async (id: number) => {
  const db = useDB();
  return await db.query.observations.findFirst({
    where: eq(observations.id, id),
    with: { images: true, capture: true }
  });
};

export const createObservationsFromCapture = async (captureId: number, observations: ObservationPayload[]) => {
  const db = useDB();

  return await db.transaction(async tx =>
    withTransaction(tx, async () => {
      return await Promise.all(
        observations.map(async selections => {
          return await createObservations(captureId, selections);
        })
      );
    })
  );
};

const createObservations = async (captureId: number, selections: Selection[], nickname?: string) => {
  const db = useDB();
  const user = useUser();

  const capture = await getCapture(captureId);
  const [observation] = await db
    .insert(observations)
    .values({
      captureId,
      nickname,
      observedAt: new Date(),
      observedBy: user.id
    })
    .returning();

  if (!capture.videoUrl) throw new Error('Capture has no video URL');
  const video = await downloadVideo(capture.videoUrl);
  const stats = await getStreamStats(video.path);
  const width = stats.width;
  const height = stats.height;
  if (!width || !height) throw new Error('Failed to get stream stats');

  await Promise.all(
    selections.map(async ({ timestamp, boundingBox }) => {
      const url = await getFrameFromVideo(video, stats, timestamp);

      await db.insert(images).values({
        observationId: observation.id,
        timestamp: timestamp.toString(),
        url,
        width,
        height,
        boundingBox: scaleBoundingBox(boundingBox, width, height)
      });
    })
  );

  return await getObservation(observation.id);
};

export const getObservationCount = async () => {
  const db = useDB();
  const [result] = await db.select({ count: count() }).from(observations);
  return result.count;
};

export const getObservations = (pagination: Pagination) => {
  const db = useDB();
  return db.query.observations.findMany({
    with: { images: true, capture: true, identifications: true },
    orderBy: desc(observations.observedAt),
    columns: {
      moderated: false
    },
    limit: pagination.size,
    offset: (pagination.page - 1) * pagination.size
  });
};

const scaleBoundingBox = (boundingBox: BoundingBox, width: number, height: number) => {
  return {
    ...boundingBox,
    x: Math.round(boundingBox.x * width),
    y: Math.round(boundingBox.y * height),
    width: Math.round(boundingBox.width * width),
    height: Math.round(boundingBox.height * height)
  };
};

export const getFrameFromVideo = async (video: TemporaryFile, stats: ffmpeg.FfprobeStream, timestamp: number) => {
  const { storage } = useEnvironment();
  const frame = await extractFrameFromVideo(video, timestamp, stats);
  const blobClient = storage.getBlockBlobClient(frame.name);
  await blobClient.uploadFile(frame.path);
  return blobClient.url;
};

export const downloadVideo = async (videoUrl: string) => {
  // The container has a limited amount of local storage, so we need to download the video to a temporary file
  // but not keep it around for too long.
  const url = new URL(videoUrl);
  const existing = getTemporaryFile(url.pathname);
  if (existing) return await existing;

  const response = await fetch(url);
  if (!response.ok || !response.body) throw new Error('Failed to download video');
  const file = TemporaryFile.create(url.pathname, 120 * 1000, async file => {
    await writeFile(file.path, Readable.fromWeb(response.body as ReadableStream<Uint8Array>));
  });
  return file;
};

import { randomUUID } from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import { writeFile } from 'fs/promises';
import { z } from 'zod';
import { Pagination } from '../../api/observation';
import { useEnvironment, useUser } from '../../utils/env/env';

export const extractFrameFromVideo = async (video: TemporaryFile, timestamp: number, stats: ffmpeg.FfprobeStream) => {
  if (!stats.avg_frame_rate) throw new Error('Failed to get frame rate');
  return await takeScreenshot(video, timestamp, `${stats.width}x${stats.height}`);
};

export const getStreamStats = async (videoPath: string) => {
  return new Promise<ffmpeg.FfprobeStream>((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, data) => {
      if (err) reject(err);
      resolve(data.streams[0]);
    });
  });
};
export const takeScreenshot = async (video: TemporaryFile, timestamps: number, size: string) => {
  return new Promise<TemporaryFile>((resolve, reject) => {
    return TemporaryFile.create(`${randomUUID()}.png`, 120 * 1000, async file => {
      ffmpeg(video.path)
        .screenshot({
          timestamps: [timestamps],
          folder: file.dir,
          filename: file.name,
          size
        })
        .on('end', () => resolve(file))
        .on('error', err => {
          console.error('Failed to take screenshot', err);
          reject(err);
        });
    });
  });
};
