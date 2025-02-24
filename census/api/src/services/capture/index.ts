import { DownstreamError, NotFoundError } from '@alveusgg/error';
import Mux from '@mux/mux-node';
import { and, count, desc, eq, gte, inArray, lte, or } from 'drizzle-orm';
import { Pagination } from '../../api/observation.js';
import { Capture, captures } from '../../db/schema/index.js';
import { useDB } from '../../db/transaction.js';
import { assert } from '../../utils/assert.js';
import { useEnvironment, useUser } from '../../utils/env/env.js';
import { getFeed } from '../feed/index.js';
import { downloadVideo } from '../observations/observations.js';
import { getClip } from '../twitch/index.js';
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

export interface VODNotFoundResult {
  result: 'error';
  type: 'vod_not_found';
}

interface SuccessResult {
  result: 'success';
  capture: Capture;
}

type CreateFromClipResult =
  | ClipAlreadyUsedResult
  | ClipOverlapsWithOtherCaptureResult
  | ClipIncludedInOtherCaptureResult
  | ClipContainsOtherCaptureResult
  | ClipNotFoundResult
  | ClipNotProcessedResult
  | VODNotFoundResult
  | SuccessResult;

export const createFromClip = async (
  id: string,
  userIsVerySureItIsNeeded: boolean = false
): Promise<CreateFromClipResult> => {
  const db = useDB();

  const existing = await getCaptureByClipId(id);
  const feed = await getFeed('pollinator');

  // The clip has already been used in a capture, so we can't use it again
  // The website redirects to the capture included in the error
  if (existing) {
    return {
      result: 'error',
      type: 'clip_already_used',
      capture: existing
    };
  }

  // This can fail if the clip is deleted from twitch or the vod isn't available
  const result = await getClip(id, feed.latencyFromCamToRecorderInSeconds ?? 0);
  if (result.result === 'error') {
    // error could be clip_not_found, clip_not_processed, or vod_not_found
    return result;
  }
  const clip = result.clip;
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
    capture
  };
};

export const getCapture = async (id: number) => {
  const db = useDB();
  const capture = await db.query.captures.findFirst({
    where: eq(captures.id, id),
    with: {
      observations: {
        with: {
          images: true
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
    where: and(lte(captures.startCaptureAt, startDate), gte(captures.endCaptureAt, endDate))
  });
};

// Returns captures that are fully encompassed by the given date range
export const getEncompassedByCaptures = async (startDate: Date, endDate: Date) => {
  const db = useDB();
  return await db.query.captures.findMany({
    where: and(gte(captures.startCaptureAt, startDate), lte(captures.endCaptureAt, endDate))
  });
};

// Returns captures that have to start or end date within their date ranges
export const getOverlappingCaptures = async (startDate: Date, endDate: Date) => {
  const db = useDB();
  return await db.query.captures.findMany({
    where: or(
      and(gte(captures.endCaptureAt, startDate), lte(captures.startCaptureAt, startDate)),
      and(gte(captures.startCaptureAt, endDate), lte(captures.endCaptureAt, endDate))
    )
  });
};

export const processingCaptureRequest = async (id: number) => {
  const db = useDB();
  await db.update(captures).set({ status: 'processing' }).where(eq(captures.id, id));
};

export const completeCaptureRequest = async (id: number, videoUrl: string) => {
  const db = useDB();
  const { mux } = useEnvironment();

  const updated: Partial<Capture> = {
    status: 'complete',
    videoUrl
  };

  if (mux) {
    // If we're using mux (which we are in production) we're going to create an asset and
    // wait for mux to download & process it from blob storage.
    const asset = await mux.video.assets.create({
      input: [{ url: videoUrl }],
      playback_policy: ['public'],
      video_quality: 'basic'
    });

    const assetId = asset.id;
    const publicPlayback = asset.playback_ids?.find(p => p.policy === 'public');
    assert(publicPlayback?.id, 'No public playback found on the mux asset');

    const playbackId = publicPlayback.id;
    await waitForMuxAsset(mux, assetId);

    updated.muxAssetId = assetId;
    updated.muxPlaybackId = playbackId;
  }

  const [capture] = await db.update(captures).set(updated).where(eq(captures.id, id)).returning();

  console.log(`Pre-downloading video for capture ${capture.id} for future processing. TTL: 10 minutes`);
  downloadVideo(videoUrl)
    .then(() => {
      console.log(`Downloaded video for capture ${capture.id}`);
    })
    .catch(error => {
      console.error(`Failed to download video for capture ${capture.id}`, error);
      throw error;
    });
  return capture;
};

const waitForMuxAsset = async (mux: Mux, assetId: string) => {
  return new Promise<void>((resolve, reject) => {
    const interval = setInterval(() => {
      mux.video.assets
        .retrieve(assetId)
        .then(asset => {
          console.log(`Mux asset ${assetId} is ${asset.status}`);
          if (asset.status === 'errored') {
            console.error(`Mux asset ${assetId} is in error state`, asset);
            reject(
              new DownstreamError(
                'mux',
                `Mux asset ${assetId} is in error state: ${asset.errors?.messages?.join(', ')}`
              )
            );
          }
          if (asset.status === 'ready') {
            console.log(`Mux asset ${assetId} is ready`);
            clearInterval(interval);
            resolve();
          }
        })
        .catch(error => {
          console.error(`Mux asset ${assetId} is in error state`, error);
          reject(new DownstreamError('mux', `Mux asset ${assetId} is in error state`));
        });
    }, 1000);
  });
};
