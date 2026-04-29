import { BadRequestError, DownstreamError, ForbiddenError, NotFoundError } from '@alveusgg/error';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { and, count, desc, eq, gte, inArray, isNotNull, isNull, lte, or, SQL, sql } from 'drizzle-orm';
import ffmpeg from 'fluent-ffmpeg';
import { createReadStream } from 'fs';
import { writeFile } from 'fs/promises';
import { ReadableStream } from 'node:stream/web';
import { Readable } from 'stream';
import { z } from 'zod';
import { Pagination, Query } from '../../api/observation.js';
import { BoundingBox, identifications, images, observations, sightings } from '../../db/schema/index.js';
import { useDB, withTransaction } from '../../db/transaction.js';
import { assert } from '../../utils/assert.js';
import { createConcurrencyLimiter } from '../../utils/concurrency.js';
import { useEnvironment, useUser } from '../../utils/env/env.js';
import { buildObjectUrl } from '../../utils/storage.js';
import { runLongOperation } from '../../utils/teardown.js';
import { getTemporaryFile, TemporaryFile } from '../../utils/tmp.js';
import { getPermissions } from '../auth/role.js';
import { getCapture } from '../capture/index.js';

const frameUploadLimiter = createConcurrencyLimiter(3);

const Selection = z.object({
  timestamp: z.number(),
  boundingBox: BoundingBox
});

export type Selection = z.infer<typeof Selection>;

export const ObservationPayload = z.array(Selection);

export type ObservationPayload = z.infer<typeof ObservationPayload>;

const getObservationRecord = async (id: number) => {
  const db = useDB();
  return await db.query.observations.findFirst({
    where: eq(observations.id, id),
    with: {
      sightings: {
        with: {
          images: true,
          observer: true,
          capture: {
            with: {
              capturer: true
            }
          }
        }
      },
      identifications: {
        with: {
          suggester: true,
          feedback: {
            with: {
              submitter: true
            }
          },
          shiny: true
        }
      }
    }
  });
};

export const getObservation = async (id: number) => {
  const observation = await getObservationRecord(id);
  if (!observation) throw new NotFoundError('Observation not found');
  return observation;
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

export const deleteObservation = async (observationId: number) => {
  const db = useDB();
  return await db.delete(observations).where(eq(observations.id, observationId));
};

export const locateObservation = async (observationId: number, location: { x: number; y: number }) => {
  const db = useDB();
  const permissions = getPermissions();
  const observation = await db.query.observations.findFirst({
    where: eq(observations.id, observationId),
    columns: {
      location: true
    }
  });
  if (!observation) throw new NotFoundError('Observation not found');
  if (observation.location && !permissions.moderate)
    throw new ForbiddenError(`You are not authorized to overwrite this observation's location`);

  await db
    .update(observations)
    .set({
      location
    })
    .where(eq(observations.id, observationId));
};

const createObservations = async (captureId: number, selections: Selection[], nickname?: string) => {
  const db = useDB();
  const user = useUser();

  return runLongOperation(async () => {
    const capture = await getCapture(captureId);
    if (capture.status !== 'complete') throw new BadRequestError('Capture is not completed');
    assert(capture.videoUrl, 'Capture has no video URL');

    await new Promise(resolve => setTimeout(resolve, 4000));

    const observedAt = new Date();
    const [observation] = await db
      .insert(observations)
      .values({
        observedAt
      })
      .returning();

    const [sighting] = await db
      .insert(sightings)
      .values({
        observationId: observation.id,
        captureId,
        nickname,
        observedAt,
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
        console.log(`Getting frame from video for timestamp ${timestamp}`);
        const url = await getFrameFromVideo(video, stats, timestamp);

        await db.insert(images).values({
          sightingId: sighting.id,
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

export const getImagesForObservationId = async (observationId: number) => {
  const observation = await getObservation(observationId);
  return observation.sightings.flatMap(sighting => sighting.images);
};

export const getObservationCount = async () => {
  const db = useDB();
  const [result] = await db.select({ count: count() }).from(observations);
  return result.count;
};

export const getUnconfirmedObservationCount = async () => {
  const db = useDB();
  const [result] = await db.select({ count: count() }).from(observations).where(isNull(observations.confirmedAs));
  return result.count;
};

export const getObservations = async (pagination: Pagination, query?: Query) => {
  const db = useDB();
  const conditions: SQL<unknown>[] = [];

  if (query?.confirmed) {
    conditions.push(isNotNull(observations.confirmedAs));
  } else {
    conditions.push(isNull(observations.confirmedAs));
  }

  if (query?.within) {
    const boxes = Array.isArray(query.within) ? query.within : [query.within];
    conditions.push(
      or(
        ...boxes.map(
          box => sql`${observations.location} <@ box(point(${box.x1}, ${box.y1}), point(${box.x2}, ${box.y2}))`
        )
      )!
    );
  }

  if (query?.start) conditions.push(gte(observations.observedAt, query.start));
  if (query?.end) conditions.push(lte(observations.observedAt, query.end));

  const rows = await db.query.observations.findMany({
    with: {
      sightings: {
        with: {
          images: true,
          observer: true,
          capture: {
            with: {
              capturer: true
            }
          }
        }
      },
      identifications: {
        with: {
          suggester: true,
          feedback: {
            with: {
              submitter: true
            }
          },
          shiny: true
        }
      },
      confirmedIdentification: {
        with: {
          suggester: true
        }
      }
    },
    orderBy: desc(observations.observedAt),
    where: and(...conditions),
    limit: pagination.size,
    offset: (pagination.page - 1) * pagination.size
  });

  return rows;
};

export const mergeObservations = async (targetObservationId: number, sourceObservationIds: number[]) => {
  const ids = [...new Set(sourceObservationIds)].filter(id => id !== targetObservationId);
  if (ids.length === 0) throw new BadRequestError('No source observations selected');

  const db = useDB();
  return await db.transaction(async tx =>
    withTransaction(tx, async () => {
      const target = await tx.query.observations.findFirst({
        where: eq(observations.id, targetObservationId)
      });

      if (!target) throw new NotFoundError('Target observation not found');

      const sources = await tx.query.observations.findMany({
        where: inArray(observations.id, ids)
      });

      if (sources.length !== ids.length) throw new NotFoundError('One or more source observations were not found');

      await tx
        .update(sightings)
        .set({ observationId: targetObservationId })
        .where(inArray(sightings.observationId, ids));

      await tx
        .update(identifications)
        .set({ observationId: targetObservationId })
        .where(inArray(identifications.observationId, ids));

      const earliestObservedAt = [target.observedAt, ...sources.map(source => source.observedAt)].reduce(
        (earliest, current) => (current.getTime() < earliest.getTime() ? current : earliest)
      );

      await tx
        .update(observations)
        .set({
          observedAt: earliestObservedAt,
          removed: target.removed && sources.every(source => source.removed),
          confirmedAs:
            target.confirmedAs ?? sources.map(source => source.confirmedAs).find(value => value != null) ?? null,
          moderated: [...target.moderated, ...sources.flatMap(source => source.moderated)],
          discordThreadId:
            target.discordThreadId ?? sources.map(source => source.discordThreadId).find(value => value != null) ?? null
        })
        .where(eq(observations.id, targetObservationId));

      await tx.delete(observations).where(inArray(observations.id, ids));

      return await getObservation(targetObservationId);
    })
  );
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
  const { storage, variables } = useEnvironment();
  console.log(`Extracting frame from video for timestamp ${timestamp}`);
  const frame = await extractFrameFromVideo(video, timestamp, stats);
  return await frameUploadLimiter.run(async () => {
    console.log(`Uploading frame to S3: ${frame.name}`);
    try {
      await storage.send(
        new PutObjectCommand({
          Bucket: variables.S3_BUCKET,
          Key: frame.name,
          Body: createReadStream(frame.path)
        })
      );
      console.log(`Uploaded frame to S3: ${frame.name}`);
      return buildObjectUrl(variables, frame.name);
    } catch (error) {
      console.error(`Failed to upload frame to S3: ${frame.name}`, error);
      throw new DownstreamError('s3', `Failed to upload frame to S3: ${frame.name}`);
    }
  });
};

// TODO: This should be promise memoized so videos aren't downloaded multiple times for one process
export const downloadVideo = async (videoUrl: string) => {
  return runLongOperation(async () => {
    // The container has a limited amount of local storage, so we need to download the video to a temporary file
    // but not keep it around for too long.
    const url = new URL(videoUrl);
    console.log(`Looking for existing video at ${url.pathname}`);
    const existing = getTemporaryFile(url.pathname);
    if (existing) {
      console.log('Existing video found, returning...');
      return await existing;
    }
    console.log('No existing video found, downloading...');

    const response = await fetch(url);
    if (!response.ok || !response.body) throw new DownstreamError('ffmpeg', 'Failed to download video');
    const file = await TemporaryFile.create(url.pathname, 10 * 60 * 1000, async file => {
      await writeFile(file.path, Readable.fromWeb(response.body as ReadableStream<Uint8Array>));
    });
    console.log('Downloaded video', file.path);
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
      if (err) {
        if (err instanceof Error) {
          reject(new DownstreamError('ffmpeg', `Failed to get stream stats for ${videoPath}: ${err.message}`));
          return;
        }
        reject(new DownstreamError('ffmpeg', `Failed to get stream stats for ${videoPath}`));
        return;
      }
      const streams = data.streams;
      if (!streams || streams.length === 0) reject(new DownstreamError('ffmpeg', 'No streams found'));
      const videoStream = streams.find(stream => stream.codec_type === 'video');
      if (!videoStream) {
        reject(new DownstreamError('ffmpeg', 'No video stream found'));
        return;
      }
      resolve(videoStream);
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
