import { DownstreamError, ProcessingError } from '@alveusgg/error';
import { addHours, addSeconds, differenceInSeconds, isBefore, setMinutes, setSeconds, subMinutes } from 'date-fns';
import sharp from 'sharp';
import { useEnvironment } from '../../utils/env/env.js';
import { ClipNotFoundResult, ClipNotProcessedResult, VODNotFoundResult } from '../capture/index.js';
type ClipSuccessResult = {
  result: 'success';
  clip: {
    id: string;
    title: string;
    embedUrl: string;
    thumbnailUrl: string;
    startDate: Date;
    endDate: Date;
    views: number;
  };
};
type ClipResult = ClipNotFoundResult | ClipNotProcessedResult | VODNotFoundResult | ClipSuccessResult;

export const getClip = async (id: string): Promise<ClipResult> => {
  const { twitch } = useEnvironment();
  const clip = await twitch.clips.getClipById(id);
  if (!clip || !clip.id || !clip.creationDate) return { result: 'error', type: 'clip_not_found' };
  if ((!clip.videoId || !clip.vodOffset) && isBefore(clip.creationDate, subMinutes(new Date(), 10))) {
    return { result: 'error', type: 'vod_not_found' };
  }

  const estimatedStartDate = await (async () => {
    if (!clip.videoId || !clip.vodOffset) return clip.creationDate;
    const vod = await getVOD(clip.videoId);
    const vodStartDate = new Date(vod.publishedAt);
    return addSeconds(vodStartDate, clip.vodOffset);
  })();

  const encodedTimestamp = await getEncodedTimestamp(getThumbnailUrl(clip.thumbnailUrl));
  const startDate = estimateStartDateFromTwitchTimestampAndEncodedTimestamp(estimatedStartDate, encodedTimestamp);
  const endDate = addSeconds(startDate, clip.duration);

  const result = {
    id,
    title: clip.title,
    embedUrl: clip.embedUrl,
    thumbnailUrl: clip.thumbnailUrl,
    startDate,
    endDate,
    views: clip.views
  };
  return { result: 'success', clip: result };
};

export const getVOD = async (id: string) => {
  const { twitch } = useEnvironment();
  const vod = await twitch.videos.getVideoById(id);
  if (!vod) throw new DownstreamError('twitch', 'The VOD associated with this clip was not found');

  return {
    id,
    title: vod.title,
    durationInSeconds: vod.durationInSeconds,
    publishedAt: vod.publishDate,
    views: vod.views
  };
};

export interface Color {
  r: number;
  g: number;
  b: number;
}

// const colors = ["#7E7E7E", "#4E3029"];
const Colors: Color[] = [
  { r: 126, g: 126, b: 126 },
  { r: 78, g: 48, b: 41 }
];

interface ClosestColor {
  index: number;
  distance: number;
}

export const getClosestColor = (color: Color) => {
  const closestColor = Colors.reduce<ClosestColor>(
    (closest, value, index) => {
      const distance = Math.sqrt((color.r - value.r) ** 2 + (color.g - value.g) ** 2 + (color.b - value.b) ** 2);
      return distance < closest.distance ? { index, distance } : closest;
    },
    { index: 0, distance: Infinity } as ClosestColor
  );

  return closestColor.index;
};

const regex = /-\d+x\d+/;
export const getThumbnailUrl = (url: string) => url.replace(regex, '');

export const getEncodedTimestamp = async (url: string) => {
  const thumbnail = await fetch(url);
  const buffer = await thumbnail.arrayBuffer();
  const image = sharp(buffer);

  const metadata = await image.metadata();
  const { width, height } = metadata;
  if (!width || !height) throw new ProcessingError('Invalid thumbnail');
  // Ensure the image has sufficient dimensions
  if (width < 2 + 4 * 11 || height < 2) {
    // 2 pixels offset + 4 pixels step * 11 steps for 12 values
    throw new ProcessingError('Image is too small for the specified extraction parameters.');
  }

  const rawBuffer = await image.raw().toBuffer();

  const getPixelColor = (x: number, y: number) => {
    const channels = 3; // RGB
    const idx = (width * y + x) * channels;
    return {
      r: rawBuffer[idx],
      g: rawBuffer[idx + 1],
      b: rawBuffer[idx + 2]
    };
  };

  let binary = '';

  const startX = width - 2;
  const startY = height - 2;

  for (let i = 11; i >= 0; i--) {
    const currentX = startX - i * 4;
    const currentY = startY;

    if (currentX < 0) {
      console.warn(`Pixel position (${currentX}, ${currentY}) is outside image boundaries.`);
      break;
    }

    const color = getPixelColor(currentX, currentY);
    binary += getClosestColor(color);
  }

  const result = parseInt(binary, 2);
  const minutes = Math.floor(result / 60);
  const seconds = result % 60;
  return { minutes, seconds };
};

const applyEncodedTimestamp = (date: Date, encodedTimestamp: { minutes: number; seconds: number }) => {
  return setSeconds(setMinutes(date, encodedTimestamp.minutes), encodedTimestamp.seconds);
};

export const estimateStartDateFromTwitchTimestampAndEncodedTimestamp = (
  twitchTimestamp: Date,
  encodedTimestamp: { minutes: number; seconds: number }
) => {
  const date = applyEncodedTimestamp(twitchTimestamp, encodedTimestamp);
  const candidates = [addHours(date, -1), date, addHours(date, 1)];

  const closestCandidate = candidates.reduce<Date>((closest, candidate) => {
    const currentDifference = Math.abs(differenceInSeconds(closest, twitchTimestamp));
    const candidateDifference = Math.abs(differenceInSeconds(candidate, twitchTimestamp));
    if (currentDifference < candidateDifference) {
      return closest;
    }
    return candidate;
  }, candidates[0]);

  return closestCandidate;
};
