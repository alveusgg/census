import { DownstreamError, NotFoundError } from '@alveusgg/error';
import { Mux } from '@mux/mux-node';
import { isBefore } from 'date-fns';
import { and, asc, count, desc, eq, gte, inArray, isNull, lte, notInArray, or, sql } from 'drizzle-orm';
import { Pagination } from '../../api/observation.js';
import { Capture, captures, sightings } from '../../db/schema/index.js';
import { useDB } from '../../db/transaction.js';
import { assert } from '../../utils/assert.js';
import { useEnvironment, useUser } from '../../utils/env/env.js';
import { getFeed } from '../feed/index.js';
import { getCurrentSeason } from '../seasons/season.js';
import { getClip } from '../twitch/index.js';

const MAX_UPGRADE_ATTEMPTS = 15;
// 'dead' means the retry queue exhausted its attempts, 'user_killed' means the
// user explicitly cleared the capture. Both are terminal.
const KILLED_STATUSES: Capture['status'][] = ['dead', 'user_killed'];

// Statuses the capture queue is allowed to transition from. Terminal statuses
// ('dead', 'user_killed') and 'complete' must never be overwritten by the
// queue, e.g. when a user kills a capture while an attempt is in flight.
const QUEUE_OWNED_STATUSES: Capture['status'][] = ['pending', 'processing', 'failed'];

interface ClipAlreadyUsedResult {
  result: 'error';
  type: 'clip_already_used';
  capture: Capture;
}

interface ClipOverlapsWithOtherCaptureResult {
  result: 'error';
  type: 'clip_overlaps_with_other_capture';
  captures: Capture[];
}

interface ClipIncludedInOtherCaptureResult {
  result: 'error';
  type: 'clip_included_in_other_capture';
  captures: Capture[];
}

interface ClipContainsOtherCaptureResult {
  result: 'error';
  type: 'clip_contains_other_capture';
  captures: Capture[];
}

export interface ClipNotFoundResult {
  result: 'error';
  type: 'clip_not_found';
}

export interface ClipNotProcessedResult {
  result: 'error';
  type: 'clip_not_processed';
}

export interface ClipNotRightChannelResult {
  result: 'error';
  type: 'clip_not_right_channel';
}

export interface SubmissionNotOpenResult {
  result: 'error';
  type: 'submission_not_open';
}

export interface ClipBeforeSubmissionWindowResult {
  result: 'error';
  type: 'clip_before_submission_window';
}

export interface VODNotFoundResult {
  result: 'error';
  type: 'vod_not_found';
}

export interface TimestampNotFoundResult {
  result: 'error';
  type: 'timestamp_not_found';
}

interface ClipRequestSuccessResult {
  result: 'success';
  type: 'retry_clip_capture';
  capture: Capture;
}

interface NewClipCaptureResult {
  result: 'success';
  type: 'new_clip_capture';
  capture: Capture;
}

type CreateFromClipResult =
  | ClipAlreadyUsedResult
  | ClipOverlapsWithOtherCaptureResult
  | ClipIncludedInOtherCaptureResult
  | ClipContainsOtherCaptureResult
  | ClipNotFoundResult
  | ClipBeforeSubmissionWindowResult
  | SubmissionNotOpenResult
  | ClipNotProcessedResult
  | ClipNotRightChannelResult
  | VODNotFoundResult
  | TimestampNotFoundResult
  | ClipRequestSuccessResult
  | NewClipCaptureResult;

export const createFromClip = async (
  id: string,
  userIsVerySureItIsNeeded: boolean = false
): Promise<CreateFromClipResult> => {
  const db = useDB();

  const season = await getCurrentSeason();
  if (!season.submissionAllowed) {
    return { result: 'error', type: 'submission_not_open' };
  }

  const existing = await getCaptureByClipId(id);
  const feed = await getFeed('pollinator');

  // The clip has already been used in a capture, so we can't use it again
  // The website redirects to the capture included in the error
  if (existing) {
    if (existing.status === 'failed') {
      return {
        result: 'success',
        type: 'retry_clip_capture',
        capture: existing
      };
    }

    // Resubmitting a killed clip requeues it with a fresh retry budget
    if (existing.status === 'dead' || existing.status === 'user_killed') {
      const [capture] = await db
        .update(captures)
        .set({ status: 'pending', upgradeAttemptCount: 1, retryUpgradeFrom: null })
        .where(eq(captures.id, existing.id))
        .returning();

      return {
        result: 'success',
        type: 'retry_clip_capture',
        capture
      };
    }

    return {
      result: 'error',
      type: 'clip_already_used',
      capture: existing
    };
  }

  // This can fail if the clip is deleted from twitch or the vod isn't available
  const result = await getClip(id, feed.latencyFromCamToRecorderInSeconds ?? 0);
  if (result.result === 'error') {
    // error could be clip_not_found, clip_not_right_channel, clip_not_processed, vod_not_found, or timestamp_not_found
    return result;
  }

  const clip = result.clip;

  if (isBefore(clip.startDate, season.submissionWindowStart)) {
    return {
      result: 'error',
      type: 'clip_before_submission_window'
    };
  }

  // If the clip is fully encompassed by another capture (e.g. it's a shorter clip of a longer clip) we can't use it
  // The website redirects to the capture included in the error
  const encompassing = await getEncompassingCaptures(clip.startDate, clip.endDate);
  if (encompassing.length > 0) {
    return {
      result: 'error',
      type: 'clip_included_in_other_capture',
      captures: encompassing
    };
  }

  // If the clip overlaps with another capture (e.g. part of this clip overlaps with another clip) we _may_ not want to use it
  // The website will show a warning and the existing captures, and let the user decide if they want to use it anyway
  const overlapping = await getOverlappingCaptures(clip.startDate, clip.endDate);
  if (overlapping.length > 0 && !userIsVerySureItIsNeeded) {
    return {
      result: 'error',
      type: 'clip_overlaps_with_other_capture',
      captures: overlapping
    };
  }

  // If the clip includes other captures (e.g. it's a longer clip that includes multiple other clips) we _may_ not want to use it
  // The website will show a warning and the existing captures, and let the user decide if they want to use it anyway
  const encompassed = await getEncompassedByCaptures(clip.startDate, clip.endDate);
  if (encompassed.length > 0 && !userIsVerySureItIsNeeded) {
    return {
      result: 'error',
      type: 'clip_contains_other_capture',
      captures: encompassed
    };
  }

  const user = useUser();
  // If we've made it this far, we can create the capture
  const [capture] = await db
    .insert(captures)
    .values({
      clipId: id,
      startCaptureAt: clip.startDate,
      endCaptureAt: clip.endDate,
      capturedAt: new Date(),
      capturedBy: user.id,
      feedId: feed.id,
      clipMetadata: { views: clip.views, thumbnail: clip.thumbnailUrl }
    })
    .returning();

  return {
    result: 'success',
    type: 'new_clip_capture',
    capture
  };
};

export const getCapture = async (id: number) => {
  const db = useDB();
  const capture = await db.query.captures.findFirst({
    where: eq(captures.id, id),
    with: {
      sightings: {
        with: {
          images: true,
          observation: true
        }
      }
    }
  });
  if (!capture) throw new NotFoundError('Capture not found');
  return capture;
};

export const getPendingCapturesForFeeds = async (feeds: string[]) => {
  const db = useDB();
  return await db.query.captures.findMany({
    where: and(eq(captures.status, 'pending'), inArray(captures.feedId, feeds))
  });
};

export const getNextCaptureRequest = async () => {
  const db = useDB();

  return await db.query.captures.findFirst({
    where: or(
      eq(captures.status, 'pending'),
      and(
        eq(captures.status, 'failed'),
        or(isNull(captures.retryUpgradeFrom), sql`${captures.retryUpgradeFrom} <= now()`)
      )
    ),
    orderBy: [
      sql`case when ${captures.status} = 'pending' then 0 else 1 end`,
      sql`coalesce(${captures.retryUpgradeFrom}, ${captures.capturedAt})`,
      asc(captures.capturedAt)
    ]
  });
};

export const getCaptureCount = async () => {
  const db = useDB();
  const [result] = await db.select({ count: count() }).from(captures);
  return result.count;
};

export const getCaptures = async (pagination: Pagination) => {
  const db = useDB();
  return await db.query.captures.findMany({
    limit: pagination.size,
    offset: (pagination.page - 1) * pagination.size,
    orderBy: [desc(captures.capturedAt)]
  });
};

export const getUnconvertedCapturesForUser = async (userId: number) => {
  const db = useDB();
  const rows = await db
    .select({ capture: captures })
    .from(captures)
    .leftJoin(sightings, and(eq(sightings.captureId, captures.id), eq(sightings.observedBy, userId)))
    .where(and(eq(captures.capturedBy, userId), notInArray(captures.status, KILLED_STATUSES), isNull(sightings.id)))
    .orderBy(desc(captures.capturedAt))
    .limit(10);

  return rows.map(row => row.capture);
};

export const killCaptureForUser = async (id: number, userId: number) => {
  const db = useDB();
  const [capture] = await db
    .update(captures)
    .set({ status: 'user_killed', retryUpgradeFrom: null })
    .where(and(eq(captures.id, id), eq(captures.capturedBy, userId)))
    .returning();

  if (!capture) throw new NotFoundError('Capture not found');
  return capture;
};

export const getCaptureByClipId = async (id: string) => {
  const db = useDB();
  return await db.query.captures.findFirst({
    where: eq(captures.clipId, id)
  });
};

// Returns captures that fully contain the given date range
export const getEncompassingCaptures = async (startDate: Date, endDate: Date) => {
  const db = useDB();
  return await db.query.captures.findMany({
    where: and(
      notInArray(captures.status, KILLED_STATUSES),
      lte(captures.startCaptureAt, startDate),
      gte(captures.endCaptureAt, endDate)
    )
  });
};

// Returns captures that are fully encompassed by the given date range
export const getEncompassedByCaptures = async (startDate: Date, endDate: Date) => {
  const db = useDB();
  return await db.query.captures.findMany({
    where: and(
      notInArray(captures.status, KILLED_STATUSES),
      gte(captures.startCaptureAt, startDate),
      lte(captures.endCaptureAt, endDate)
    )
  });
};

// Returns captures that have to start or end date within their date ranges
export const getOverlappingCaptures = async (startDate: Date, endDate: Date) => {
  const db = useDB();
  return await db.query.captures.findMany({
    where: and(
      notInArray(captures.status, KILLED_STATUSES),
      or(
        and(gte(captures.endCaptureAt, startDate), lte(captures.startCaptureAt, startDate)),
        and(gte(captures.startCaptureAt, endDate), lte(captures.endCaptureAt, endDate))
      )
    )
  });
};

export const completeCaptureRequest = async (id: number, videoUrl: string, lowQualityVideoUrl?: string) => {
  const db = useDB();
  const { mux } = useEnvironment();

  const updated: Partial<Capture> = {
    status: 'complete',
    videoUrl,
    lowQualityVideoUrl: lowQualityVideoUrl ?? null,
    retryUpgradeFrom: null
  };

  if (mux) {
    // If we're using mux (which we are in production) we're going to create an asset and
    // wait for mux to download & process it from blob storage.
    const asset = await mux.video.assets.create({
      input: [{ url: videoUrl }],
      playback_policy: ['public'],
      video_quality: 'plus',
      max_resolution_tier: '2160p'
    });

    const assetId = asset.id;
    const publicPlayback = asset.playback_ids?.find(p => p.policy === 'public');
    assert(publicPlayback?.id, 'No public playback found on the mux asset');

    const playbackId = publicPlayback.id;
    await waitForMuxAsset(mux, assetId);

    updated.muxAssetId = assetId;
    updated.muxPlaybackId = playbackId;
  }

  const [capture] = await db
    .update(captures)
    .set(updated)
    .where(and(eq(captures.id, id), inArray(captures.status, QUEUE_OWNED_STATUSES)))
    .returning();

  return capture;
};

/**
 * Claims a capture for processing. Returns the updated capture, or undefined
 * if the capture is no longer in a queue-owned status (e.g. the user killed it
 * between it being picked up and the attempt starting).
 */
export const processingCaptureRequest = async (id: number) => {
  const db = useDB();
  const [capture] = await db
    .update(captures)
    .set({ status: 'processing', retryUpgradeFrom: null })
    .where(and(eq(captures.id, id), inArray(captures.status, ['pending', 'failed'])))
    .returning();

  return capture;
};

export const failCaptureRequest = async (id: number) => {
  const db = useDB();
  await db
    .update(captures)
    .set({
      status: sql`
        case
          when ${captures.upgradeAttemptCount} + 1 > ${MAX_UPGRADE_ATTEMPTS} then 'dead'::capture_status
          else 'failed'::capture_status
        end
      `,
      upgradeAttemptCount: sql`${captures.upgradeAttemptCount} + 1`,
      // Exponential backoff per capture (30s, 1m, 2m, ... capped at 1h) so the
      // retry budget spans many hours rather than being burned within the
      // first hour of a downstream outage.
      retryUpgradeFrom: sql`
        case
          when ${captures.upgradeAttemptCount} + 1 > ${MAX_UPGRADE_ATTEMPTS} then null
          else now() + least(interval '30 seconds' * power(2, ${captures.upgradeAttemptCount} - 1), interval '1 hour')
        end
      `
    })
    .where(and(eq(captures.id, id), inArray(captures.status, QUEUE_OWNED_STATUSES)));
};

/**
 * Requeues captures stranded in 'processing' by a crash or deploy so they are
 * retried instead of being stuck forever. Doesn't consume a retry attempt.
 * Captures currently being completed by this process can be excluded.
 *
 * Retry times are jittered over a window so that a deploy with a backlog of
 * stranded captures doesn't hammer the cam manager all at once.
 */
export const requeueStuckProcessingCaptures = async (excludeIds: number[] = []) => {
  const db = useDB();
  const conditions = [eq(captures.status, 'processing')];
  if (excludeIds.length > 0) conditions.push(notInArray(captures.id, excludeIds));

  return await db
    .update(captures)
    .set({ status: 'failed', retryUpgradeFrom: sql`now() + (random() * interval '10 minutes')` })
    .where(and(...conditions))
    .returning({ id: captures.id });
};

const MUX_ASSET_POLL_INTERVAL_MS = 1_000;
const MUX_ASSET_TIMEOUT_MS = 10 * 60_000;
const MUX_ASSET_MAX_CONSECUTIVE_POLL_ERRORS = 5;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const waitForMuxAsset = async (mux: Mux, assetId: string) => {
  const deadline = Date.now() + MUX_ASSET_TIMEOUT_MS;
  let consecutivePollErrors = 0;

  while (true) {
    try {
      const asset = await mux.video.assets.retrieve(assetId);
      consecutivePollErrors = 0;

      if (asset.status === 'ready') {
        console.log(`Mux asset ${assetId} is ready`);
        return;
      }

      if (asset.status === 'errored') {
        console.error(`Mux asset ${assetId} is in error state`, asset);
        throw new DownstreamError(
          'mux',
          `Mux asset ${assetId} is in error state: ${asset.errors?.messages?.join(', ')}`
        );
      }

      console.log(`Mux asset ${assetId} is ${asset.status}`);
    } catch (error) {
      if (error instanceof DownstreamError) throw error;

      // Transient polling errors (network blips etc.) shouldn't fail the
      // capture, only give up after several consecutive failures.
      consecutivePollErrors += 1;
      console.error(
        `Failed to poll mux asset ${assetId} (${consecutivePollErrors}/${MUX_ASSET_MAX_CONSECUTIVE_POLL_ERRORS})`,
        error
      );
      if (consecutivePollErrors >= MUX_ASSET_MAX_CONSECUTIVE_POLL_ERRORS) {
        throw new DownstreamError('mux', `Failed to poll mux asset ${assetId} after repeated errors`);
      }
    }

    if (Date.now() >= deadline) {
      throw new DownstreamError('mux', `Timed out waiting for mux asset ${assetId} to become ready`);
    }

    await sleep(MUX_ASSET_POLL_INTERVAL_MS);
  }
};
