import { BadRequestError, DownstreamError, ForbiddenError, NotFoundError } from '@alveusgg/error';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { and, count, desc, eq, gte, inArray, isNotNull, isNull, lte, ne, or, SQL, sql } from 'drizzle-orm';
import ffmpeg from 'fluent-ffmpeg';
import { createReadStream } from 'fs';
import { z } from 'zod';
import { Pagination, Query } from '../../api/observation.js';
import {
  achievements,
  BoundingBox,
  feedback,
  identifications,
  images,
  observations,
  shinies,
  sightings
} from '../../db/schema/index.js';
import { useDB, withTransaction } from '../../db/transaction.js';
import { assert } from '../../utils/assert.js';
import { createConcurrencyLimiter, createRetrier } from '../../utils/concurrency.js';
import { useEnvironment, useUser } from '../../utils/env/env.js';
import { buildObjectUrl } from '../../utils/storage.js';
import { runLongOperation } from '../../utils/teardown.js';
import { TemporaryFile } from '../../utils/tmp.js';
import { getPermissions } from '../auth/role.js';
import { getCapture } from '../capture/index.js';
import { recordAchievement } from '../points/achievement.js';

const frameUploadLimiter = createConcurrencyLimiter(3);
const frameUploadRetrier = createRetrier(3);

export const observationDeletionReasons = ['no_valid_subject', 'too_poor_quality'] as const;
export type ObservationDeletionReason = (typeof observationDeletionReasons)[number];

const confirmWithoutAccessoryIdentificationModerationType = 'confirm_without_accessory_identification';

const deletionReasonsThatRevokeSubmissionPoints = new Set<ObservationDeletionReason>(['no_valid_subject']);

const activeIdentification = () => isNull(identifications.deletedAt);

const observationDeletionReasonLabels: Record<ObservationDeletionReason, string> = {
  no_valid_subject: 'No valid subject',
  too_poor_quality: 'Too poor quality'
};

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
    where: and(eq(observations.id, id), eq(observations.removed, false)),
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
        where: isNull(identifications.deletedAt),
        with: {
          suggester: true,
          feedback: {
            where: isNull(feedback.deletedAt),
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
  const user = useUser();

  await recordAchievement('observe', user.id, { payload: { captureId } }, true);

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

export const deleteObservation = async (observationId: number, reason: ObservationDeletionReason) => {
  const db = useDB();
  const user = useUser();

  return await db.transaction(async tx =>
    withTransaction(tx, async () => {
      const observation = await tx.query.observations.findFirst({
        where: eq(observations.id, observationId)
      });
      if (!observation) throw new NotFoundError('Observation not found');
      if (observation.removed) throw new BadRequestError('Observation has already been removed');

      const observationIdentifications = await tx.query.identifications.findMany({
        where: eq(identifications.observationId, observationId),
        columns: {
          id: true
        }
      });
      const identificationIds = observationIdentifications.map(identification => identification.id);

      const observationSightings = await tx.query.sightings.findMany({
        where: eq(sightings.observationId, observationId),
        columns: {
          captureId: true,
          observedBy: true
        }
      });
      const revokeSubmissionPoints = deletionReasonsThatRevokeSubmissionPoints.has(reason);

      if (identificationIds.length > 0) {
        await tx
          .update(achievements)
          .set({ revoked: true })
          .where(
            and(
              inArray(achievements.identificationId, identificationIds),
              inArray(achievements.type, ['vote', 'comment', 'assist', 'identify', 'shiny']),
              eq(achievements.revoked, false)
            )
          );

        await tx
          .update(shinies)
          .set({ identificationId: null })
          .where(inArray(shinies.identificationId, identificationIds));

        await tx
          .update(feedback)
          .set({ deletedAt: new Date() })
          .where(and(inArray(feedback.identificationId, identificationIds), isNull(feedback.deletedAt)));

        await tx
          .update(identifications)
          .set({ confirmedBy: null, shinyId: null, deletedAt: new Date() })
          .where(inArray(identifications.id, identificationIds));
      }

      if (revokeSubmissionPoints) {
        for (const sighting of observationSightings) {
          const [activeSighting] = await tx
            .select({ id: sightings.id })
            .from(sightings)
            .innerJoin(observations, eq(sightings.observationId, observations.id))
            .where(
              and(
                eq(sightings.captureId, sighting.captureId),
                eq(sightings.observedBy, sighting.observedBy),
                ne(sightings.observationId, observationId),
                eq(observations.removed, false)
              )
            )
            .limit(1);

          if (!activeSighting) {
            await tx
              .update(achievements)
              .set({ revoked: true })
              .where(
                and(
                  eq(achievements.userId, sighting.observedBy),
                  eq(achievements.type, 'observe'),
                  eq(achievements.revoked, false),
                  sql`${achievements.payload}->'payload'->>'captureId' = ${sighting.captureId.toString()}`
                )
              );
          }
        }
      }

      const moderationEntry = {
        userId: user.id.toString(),
        type: 'delete',
        message: observationDeletionReasonLabels[reason]
      };

      await tx
        .update(observations)
        .set({
          removed: true,
          confirmedAs: null,
          moderated: [...observation.moderated, moderationEntry]
        })
        .where(eq(observations.id, observationId));

      return { removed: true, pointsChanged: revokeSubmissionPoints || identificationIds.length > 0 };
    })
  );
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

export const confirmObservationWithoutAccessoryIdentification = async (observationId: number) => {
  const db = useDB();
  const user = useUser();

  const observation = await db.query.observations.findFirst({
    where: and(eq(observations.id, observationId), eq(observations.removed, false)),
    columns: {
      confirmedAs: true,
      moderated: true
    }
  });
  if (!observation) throw new NotFoundError('Observation not found');
  if (!observation.confirmedAs)
    throw new BadRequestError('Observation does not have a confirmed primary identification');

  const primaryIdentification = await db.query.identifications.findFirst({
    where: and(
      eq(identifications.id, observation.confirmedAs),
      sql`${identifications.isAccessory} is not true`,
      isNotNull(identifications.confirmedBy),
      activeIdentification()
    )
  });
  if (!primaryIdentification) throw new BadRequestError('Observation does not have a confirmed primary identification');

  const confirmedAccessoryIdentification = await db.query.identifications.findFirst({
    where: and(
      eq(identifications.observationId, observationId),
      eq(identifications.isAccessory, true),
      isNotNull(identifications.confirmedBy),
      activeIdentification()
    )
  });
  if (confirmedAccessoryIdentification)
    throw new BadRequestError('Observation already has a confirmed accessory identification');

  if (observation.moderated.some(entry => entry.type === confirmWithoutAccessoryIdentificationModerationType)) return;

  await db
    .update(observations)
    .set({
      moderated: [
        ...observation.moderated,
        {
          userId: user.id.toString(),
          type: confirmWithoutAccessoryIdentificationModerationType,
          message: 'Confirmed without accessory identification'
        }
      ]
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
    const videoUrl = capture.videoUrl;

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

    const stats = await getStreamStats(videoUrl);
    const width = stats.width;
    const height = stats.height;
    assert(width && height, 'Failed to get stream stats');

    await Promise.all(
      selections.map(async ({ timestamp, boundingBox }) => {
        console.log(`Getting frame from video for timestamp ${timestamp}`);
        const url = await getFrameFromVideo(videoUrl, timestamp);

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
  }, 'Processing capture images');
};

export const getImagesForObservationId = async (observationId: number) => {
  const observation = await getObservation(observationId);
  return observation.sightings.flatMap(sighting => sighting.images);
};

const getObservationConditions = (query?: Query) => {
  const conditions: SQL<unknown>[] = [eq(observations.removed, false)];

  if (query?.confirmed) {
    conditions.push(hasConfirmedObservation);
  } else {
    conditions.push(sql`not ${hasConfirmedObservation}`);
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

  return conditions;
};

export const getObservationCount = async (query?: Query) => {
  const db = useDB();
  const [result] = await db
    .select({ count: count() })
    .from(observations)
    .where(and(...getObservationConditions(query)));
  return result.count;
};

const hasConfirmedPrimaryIdentification = sql`
  exists (
    select 1
    from identifications
    where identifications.id = observations.confirmed_as
      and identifications.is_accessory is not true
      and identifications.confirmed_by is not null
      and identifications.deleted_at is null
  )
`;

const hasConfirmedAccessoryIdentification = sql`
  exists (
    select 1
    from identifications
    where identifications.observation_id = observations.id
      and identifications.is_accessory is true
      and identifications.confirmed_by is not null
      and identifications.deleted_at is null
  )
`;

const hasAccessoryIdentificationBypass = sql`
  exists (
    select 1
    from json_array_elements(observations.moderated) as moderation_entry(value)
    where moderation_entry.value->>'type' = ${confirmWithoutAccessoryIdentificationModerationType}
  )
`;

const hasConfirmedObservation = sql`
  (
    ${hasConfirmedPrimaryIdentification}
    and (${hasConfirmedAccessoryIdentification} or ${hasAccessoryIdentificationBypass})
  )
`;

export const getUnconfirmedObservationCount = async () => {
  const db = useDB();
  const [result] = await db
    .select({ count: count() })
    .from(observations)
    .where(and(eq(observations.removed, false), sql`not ${hasConfirmedObservation}`));
  return result.count;
};

export const getObservations = async (pagination: Pagination, query?: Query) => {
  const db = useDB();
  const conditions = getObservationConditions(query);

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
        where: isNull(identifications.deletedAt),
        with: {
          suggester: true,
          feedback: {
            where: isNull(feedback.deletedAt),
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

type IdentificationRecord = typeof identifications.$inferSelect;

const getIdentificationMergeKey = (identification: Pick<IdentificationRecord, 'sourceId' | 'isAccessory'>) => {
  const suggestionType = identification.isAccessory === true ? 'accessory' : 'primary';
  return `${suggestionType}:${identification.sourceId}`;
};

const getDuplicateIdentificationReplacements = (mergedIdentifications: IdentificationRecord[]) => {
  const retainedIdentificationByKey = new Map<string, IdentificationRecord>();
  const replacements = new Map<number, number>();

  for (const identification of [...mergedIdentifications].sort((a, b) => a.id - b.id)) {
    const key = getIdentificationMergeKey(identification);
    const retainedIdentification = retainedIdentificationByKey.get(key);

    if (!retainedIdentification) {
      retainedIdentificationByKey.set(key, identification);
      continue;
    }

    replacements.set(identification.id, retainedIdentification.id);
  }

  return replacements;
};

const resolveMergedIdentificationId = (id: number | null, replacements: Map<number, number>) => {
  if (id === null) return null;
  return replacements.get(id) ?? id;
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

      const activeMergedIdentifications = await tx.query.identifications.findMany({
        where: and(eq(identifications.observationId, targetObservationId), isNull(identifications.deletedAt))
      });
      const activeMergedIdentificationIds = new Set(
        activeMergedIdentifications.map(identification => identification.id)
      );
      const duplicateIdentificationReplacements = getDuplicateIdentificationReplacements(activeMergedIdentifications);
      const duplicateIdentificationIds = [...duplicateIdentificationReplacements.keys()];

      if (duplicateIdentificationIds.length > 0) {
        for (const [duplicateIdentificationId, retainedIdentificationId] of duplicateIdentificationReplacements) {
          await tx
            .update(identifications)
            .set({ alternateForId: retainedIdentificationId })
            .where(
              and(
                eq(identifications.observationId, targetObservationId),
                eq(identifications.alternateForId, duplicateIdentificationId)
              )
            );
        }

        const deletedAt = new Date();

        await tx
          .update(achievements)
          .set({ revoked: true })
          .where(
            and(
              inArray(achievements.identificationId, duplicateIdentificationIds),
              inArray(achievements.type, ['vote', 'comment', 'assist', 'identify', 'shiny']),
              eq(achievements.revoked, false)
            )
          );

        await tx
          .update(shinies)
          .set({ identificationId: null })
          .where(inArray(shinies.identificationId, duplicateIdentificationIds));

        await tx
          .update(feedback)
          .set({ deletedAt })
          .where(and(inArray(feedback.identificationId, duplicateIdentificationIds), isNull(feedback.deletedAt)));

        await tx
          .update(identifications)
          .set({ confirmedBy: null, shinyId: null, deletedAt })
          .where(inArray(identifications.id, duplicateIdentificationIds));
      }

      const earliestObservedAt = [target.observedAt, ...sources.map(source => source.observedAt)].reduce(
        (earliest, current) => (current.getTime() < earliest.getTime() ? current : earliest)
      );
      const selectedConfirmedAs =
        target.confirmedAs ?? sources.map(source => source.confirmedAs).find(value => value != null) ?? null;
      const resolvedConfirmedAs = resolveMergedIdentificationId(
        selectedConfirmedAs,
        duplicateIdentificationReplacements
      );

      await tx
        .update(observations)
        .set({
          observedAt: earliestObservedAt,
          removed: target.removed && sources.every(source => source.removed),
          confirmedAs:
            resolvedConfirmedAs !== null && activeMergedIdentificationIds.has(resolvedConfirmedAs)
              ? resolvedConfirmedAs
              : null,
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

export const getFrameFromVideo = async (videoUrl: string, timestamp: number) => {
  const { storage, variables } = useEnvironment();
  console.log(`Extracting frame from video for timestamp ${timestamp}`);
  return await TemporaryFile.with(`${randomUUID()}.jpg`, async frame => {
    await extractFrameFromVideo(videoUrl, timestamp, frame);
    return await frameUploadLimiter.run(async () => {
      return await frameUploadRetrier.run(async () => {
        try {
          await storage.send(
            new PutObjectCommand({
              Bucket: variables.S3_BUCKET,
              Key: frame.name,
              Body: createReadStream(frame.path)
            })
          );
          return buildObjectUrl(variables, frame.name);
        } catch (error) {
          console.error(`Failed to upload frame to S3: ${frame.name}`, error);
          throw new DownstreamError('s3', `Failed to upload frame to S3: ${frame.name}`);
        }
      });
    });
  });
};

export const extractFrameFromVideo = async (videoUrl: string, timestamp: number, frame: TemporaryFile) => {
  await takeScreenshot(videoUrl, timestamp, frame);
};

export const getStreamStats = async (videoUrl: string) => {
  return new Promise<ffmpeg.FfprobeStream>((resolve, reject) => {
    ffmpeg.ffprobe(videoUrl, (err, data) => {
      if (err) {
        if (err instanceof Error) {
          reject(new DownstreamError('ffmpeg', `Failed to get stream stats for ${videoUrl}: ${err.message}`));
          return;
        }
        reject(new DownstreamError('ffmpeg', `Failed to get stream stats for ${videoUrl}`));
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
export const takeScreenshot = async (videoUrl: string, timestamp: number, frame: TemporaryFile) => {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(videoUrl)
      .inputOptions(['-ss', timestamp.toString()])
      .outputOptions(['-frames:v', '1', '-q:v', '2', '-update', '1'])
      .output(frame.path)
      .on('end', () => resolve())
      .on('error', err => {
        console.error('Failed to take screenshot', err);
        reject(err);
      })
      .run();
  });
};
