import { Square } from '@/components/assets/images/Square';
import { Preloader } from '@/components/feed/Preloader';
import SiChevronLeft from '@/components/icons/SiChevronLeft';
import SiChevronRight from '@/components/icons/SiChevronRight';
import { Spinner } from '@/components/loaders/Spinner';
import { cn } from '@/utils/cn';
import MuxPlayer from '@mux/mux-player-react';
import { type FC, useEffect, useMemo, useState } from 'react';
import { Controls, SlidePips } from './gallery/Controls';
import { Slide } from './gallery/GalleryProvider';
import { Polaroid } from './gallery/Polaroid';
import { useCurrentObservation } from './ObservationContext';
import { getObservationVideoClips, type ObservationVideoClip } from './videoClips';

type ObservationImageData = ReturnType<typeof useCurrentObservation>['sightings'][number]['images'][number];

const ObservationImage: FC<{ alt?: string; className?: string; image: ObservationImageData }> = ({
  alt = '',
  className,
  image
}) => {
  const [hasLoadedHighResolutionImage, setHasLoadedHighResolutionImage] = useState(false);

  return (
    <div className={cn('relative h-full w-full overflow-clip', className)}>
      {!hasLoadedHighResolutionImage && (
        <div
          role="status"
          className="absolute inset-0 z-0 flex items-center justify-center gap-2 text-sm font-medium text-accent-800"
        >
          <Spinner className="h-4 w-4" />
          <span>Processing images</span>
        </div>
      )}
      <Square
        loading="lazy"
        className="absolute inset-0 z-[2] h-full w-full"
        src={image.url}
        image={{ width: image.width, height: image.height }}
        options={{ extract: image.boundingBox }}
        alt={alt}
        onLoad={() => setHasLoadedHighResolutionImage(true)}
      />
    </div>
  );
};

const getStoryboardSrc = ({ endTime, playbackId, startTime }: ObservationVideoClip) => {
  const params = new URLSearchParams({ format: 'webp' });
  if (startTime !== undefined) params.set('asset_start_time', startTime.toString());
  if (endTime !== undefined) params.set('asset_end_time', endTime.toString());
  return `https://image.mux.com/${playbackId}/storyboard.vtt?${params.toString()}`;
};

export const ObservationCardMedia: FC<{ className?: string }> = ({ className }) => {
  const observation = useCurrentObservation();
  const images = observation.sightings.flatMap(sighting => sighting.images);

  return (
    <Polaroid className={className}>
      <Preloader>
        {images.map(image => (
          <Square
            key={image.id}
            src={image.url}
            image={{ width: image.width, height: image.height }}
            options={{ extract: image.boundingBox }}
          />
        ))}
      </Preloader>
      {images.map(image => (
        <Slide key={image.id} id={image.id.toString()}>
          <ObservationImage image={image} />
        </Slide>
      ))}
      <Controls />
      <SlidePips />
    </Polaroid>
  );
};

export const ObservationPageMedia: FC<{ className?: string }> = ({ className }) => {
  const observation = useCurrentObservation();
  const images = observation.sightings.flatMap(sighting => sighting.images);
  const videoClips = useMemo(() => getObservationVideoClips(observation.sightings), [observation.sightings]);
  const [selectedPlaybackId, setSelectedPlaybackId] = useState(videoClips[0]?.playbackId);
  const selectedClip = videoClips.find(clip => clip.playbackId === selectedPlaybackId) ?? videoClips[0];
  const selectedClipIndex = selectedClip ? videoClips.indexOf(selectedClip) : 0;

  const selectRelativeClip = (offset: number) => {
    const nextIndex = (selectedClipIndex + offset + videoClips.length) % videoClips.length;
    setSelectedPlaybackId(videoClips[nextIndex].playbackId);
  };

  useEffect(() => {
    if (videoClips.length > 0 && !videoClips.some(clip => clip.playbackId === selectedPlaybackId)) {
      setSelectedPlaybackId(videoClips[0].playbackId);
    }
  }, [selectedPlaybackId, videoClips]);

  return (
    <section className={cn('min-w-0', className)}>
      <div className="aspect-video overflow-hidden rounded-md border border-accent/50 bg-black shadow-sm">
        {selectedClip ? (
          <MuxPlayer
            key={`${selectedClip.playbackId}-${selectedClip.startTime}-${selectedClip.endTime}`}
            playbackId={selectedClip.playbackId}
            assetStartTime={selectedClip.startTime}
            assetEndTime={selectedClip.endTime}
            storyboardSrc={getStoryboardSrc(selectedClip)}
            metadata={{
              video_id: `observation-${observation.id}`,
              video_title: `Observation #${observation.id}`
            }}
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-white/70">
            No stored video is available for this observation.
          </div>
        )}
      </div>
      {videoClips.length > 1 && (
        <div className="flex items-center justify-end gap-1 pt-2" aria-label="Capture video controls">
          <span className="sr-only" aria-live="polite">
            Capture {selectedClipIndex + 1} of {videoClips.length}
          </span>
          <button
            type="button"
            aria-label="Previous capture"
            onClick={() => selectRelativeClip(-1)}
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-accent/40 bg-accent-50 text-accent-900 shadow-sm transition-colors hover:bg-accent-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            <SiChevronLeft className="text-2xl" />
          </button>
          <button
            type="button"
            aria-label="Next capture"
            onClick={() => selectRelativeClip(1)}
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-accent/40 bg-accent-50 text-accent-900 shadow-sm transition-colors hover:bg-accent-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            <SiChevronRight className="text-2xl" />
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-3 sm:gap-5">
        {images.map((image, index) => (
          <div
            key={image.id}
            className={cn(
              'rounded-sm border border-accent/20 bg-white p-2.5 pb-8 shadow-[0_12px_28px_rgba(96,61,38,0.10)] sm:p-3 sm:pb-10',
              index % 3 === 0 && '-rotate-[0.4deg]',
              index % 3 === 1 && 'rotate-[0.35deg]',
              index % 3 === 2 && '-rotate-[0.15deg]'
            )}
          >
            <div className="aspect-square overflow-hidden bg-accent-100">
              <ObservationImage image={image} alt={`Observation #${observation.id} image ${index + 1}`} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
