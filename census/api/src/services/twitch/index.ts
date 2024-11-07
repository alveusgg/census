import { addSeconds, isAfter, subMinutes } from 'date-fns';
import { useEnvironment } from '../../utils/env/env';
import { ClipNotFoundResult, ClipNotProcessedResult, VODNotFoundResult } from '../capture';

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
  if (isAfter(clip.creationDate, subMinutes(new Date(), 15))) return { result: 'error', type: 'clip_not_processed' };
  if (!clip.videoId || !clip.vodOffset) return { result: 'error', type: 'vod_not_found' };
  const vod = await getVOD(clip.videoId);

  const vodStartDate = new Date(vod.publishedAt);
  const startDate = addSeconds(vodStartDate, clip.vodOffset);
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
  if (!vod) throw new Error('VOD not found');

  return {
    id,
    title: vod.title,
    durationInSeconds: vod.durationInSeconds,
    publishedAt: vod.publishDate,
    views: vod.views
  };
};
