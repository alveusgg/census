const VIDEO_TRIM_PADDING_SECONDS = 2;

interface VideoSighting {
  capture: {
    endCaptureAt: Date | string;
    muxPlaybackId: string | null;
    startCaptureAt: Date | string;
  };
  images: Array<{
    timestamp: number | string;
  }>;
}

export interface ObservationVideoClip {
  endTime?: number;
  playbackId: string;
  startTime?: number;
}

interface VideoClipAccumulator {
  duration?: number;
  playbackId: string;
  timestamps: number[];
}

const getCaptureDuration = (sighting: VideoSighting) => {
  const start = new Date(sighting.capture.startCaptureAt).getTime();
  const end = new Date(sighting.capture.endCaptureAt).getTime();
  const duration = (end - start) / 1000;
  return Number.isFinite(duration) && duration > 0 ? duration : undefined;
};

export const getObservationVideoClips = (sightings: VideoSighting[]): ObservationVideoClip[] => {
  const clips = new Map<string, VideoClipAccumulator>();

  for (const sighting of sightings) {
    const playbackId = sighting.capture.muxPlaybackId;
    if (!playbackId) continue;

    const existing = clips.get(playbackId) ?? { playbackId, timestamps: [] };
    const duration = getCaptureDuration(sighting);

    if (duration !== undefined) {
      existing.duration = existing.duration === undefined ? duration : Math.min(existing.duration, duration);
    }

    for (const image of sighting.images) {
      const timestamp = Number(image.timestamp);
      if (Number.isFinite(timestamp) && timestamp >= 0) existing.timestamps.push(timestamp);
    }

    clips.set(playbackId, existing);
  }

  return [...clips.values()].map(({ duration, playbackId, timestamps }) => {
    if (timestamps.length === 0) return { playbackId };

    const startTime = Math.max(0, Math.min(...timestamps) - VIDEO_TRIM_PADDING_SECONDS);
    const paddedEndTime = Math.max(...timestamps) + VIDEO_TRIM_PADDING_SECONDS;
    const endTime = duration === undefined ? paddedEndTime : Math.min(duration, paddedEndTime);

    return { playbackId, startTime, endTime };
  });
};
