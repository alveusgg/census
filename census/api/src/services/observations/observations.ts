import { BadRequestError, DownstreamError } from '@alveusgg/error';
import { randomUUID } from 'crypto';
import { count, desc, eq } from 'drizzle-orm';
import ffmpeg from 'fluent-ffmpeg';
import { writeFile } from 'fs/promises';
import { ReadableStream } from 'node:stream/web';
import { Readable } from 'stream';
import { z } from 'zod';
import { Pagination } from '../../api/observation.js';
import { BoundingBox, images, observations } from '../../db/schema/index.js';
import { useDB, withTransaction } from '../../db/transaction.js';
import { assert } from '../../utils/assert.js';
import { useEnvironment, useUser } from '../../utils/env/env.js';
import { runLongOperation } from '../../utils/teardown.js';
import { getTemporaryFile, TemporaryFile } from '../../utils/tmp.js';
import { getCapture } from '../capture/index.js';

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

  return runLongOperation(async () => {
    const capture = await getCapture(captureId);
    if (capture.status !== 'complete') throw new BadRequestError('Capture is not completed');
    assert(capture.videoUrl, 'Capture has no video URL');

    await new Promise(resolve => setTimeout(resolve, 4000));

    const [observation] = await db
      .insert(observations)
      .values({
        captureId,
        nickname,
        observedAt: new Date(),
        observedBy: user.id
      })
      .returning();

    const video = await downloadVideo(capture.videoUrl);
    const stats = await getStreamStats(video.path);
    const width = stats.width;
    const height = stats.height;
    assert(width && height, 'Failed to get stream stats');

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
  }, 'Download clip & process images');
};

export const getObservationCount = async () => {
  const db = useDB();
  const [result] = await db.select({ count: count() }).from(observations);
  return result.count;
};

export const getObservations = (pagination: Pagination) => {
  const db = useDB();
  return db.query.observations.findMany({
    with: {
      images: true,
      capture: true,
      identifications: {
        with: {
          suggester: true,
          feedback: true
        }
      },
      observer: true
    },
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
  return runLongOperation(async () => {
    // The container has a limited amount of local storage, so we need to download the video to a temporary file
    // but not keep it around for too long.
    const url = new URL(videoUrl);
    const existing = getTemporaryFile(url.pathname);
    if (existing) return await existing;

    const response = await fetch(url);
    if (!response.ok || !response.body) throw new DownstreamError('ffmpeg', 'Failed to download video');
    const file = TemporaryFile.create(url.pathname, 10 * 60 * 1000, async file => {
      await writeFile(file.path, Readable.fromWeb(response.body as ReadableStream<Uint8Array>));
    });
    return file;
  }, 'Download video');
};

export const extractFrameFromVideo = async (video: TemporaryFile, timestamp: number, stats: ffmpeg.FfprobeStream) => {
  if (!stats.avg_frame_rate) throw new DownstreamError('ffmpeg', 'Failed to get frame rate');
  return await takeScreenshot(video, timestamp, `${stats.width}x${stats.height}`);
};

export const getStreamStats = async (videoPath: string) => {
  return new Promise<ffmpeg.FfprobeStream>((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, data) => {
      if (err) reject(new DownstreamError('ffmpeg', 'Failed to get stream stats'));
      resolve(data.streams[0]);
    });
  });
};
export const takeScreenshot = async (video: TemporaryFile, timestamps: number, size: string) => {
  return new Promise<TemporaryFile>((resolve, reject) => {
    void TemporaryFile.create(`${randomUUID()}.png`, 120 * 1000, async file => {
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
