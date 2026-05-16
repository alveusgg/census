import { Square } from '@/components/assets/images/Square';
import { Preloader } from '@/components/feed/Preloader';
import { UserLink } from '@/components/users/UserLink';
import type { ConfirmedObservation } from '@/services/api/observations';
import { cn } from '@/utils/cn';
import { format } from 'date-fns';
import { FC } from 'react';
import { Link } from 'react-router-dom';
import { SlidePips } from '../observations/gallery/Controls';
import { Slide } from '../observations/gallery/GalleryProvider';
import { Polaroid } from '../observations/gallery/Polaroid';

interface ConfirmedObservationFeedCardProps {
  observation: ConfirmedObservation;
  className?: string;
}

interface IdentificationFeedCardProps {
  observedAt: Date | string;
  identification: {
    id: number;
    nickname: string;
    suggester: {
      id: number;
      username: string;
    };
  };
  images: {
    id: number;
    url: string;
    width: number;
    height: number;
    boundingBox: { x: number; y: number; width: number; height: number };
  }[];
  className?: string;
}

export const IdentificationFeedCard: FC<IdentificationFeedCardProps> = ({
  observedAt,
  identification,
  images,
  className
}) => {
  return (
    <div className={cn('flex flex-col', className)}>
      <div className="mb-2 flex items-center gap-2">
        <span className="whitespace-nowrap text-sm font-medium text-accent-800/80">
          {format(new Date(observedAt), 'h:mma')}
        </span>
        <div className="h-px flex-1 border-t border-dashed border-accent-300/80" />
      </div>
      <Polaroid className="aspect-auto max-w-none overflow-hidden p-3 shadow-[0_10px_28px_rgba(97,58,24,0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-accent-400 hover:shadow-[0_16px_36px_rgba(97,58,24,0.12)] sm:p-4">
        <Link to={`/identifications/${identification.id}`} className="group block">
          <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-accent-100">
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
                <div className="w-full h-full overflow-clip relative">
                  <Square
                    loading="lazy"
                    className="absolute inset-0 w-full h-full z-10 transition duration-300 group-hover:scale-[1.03]"
                    src={image.url}
                    image={{ width: image.width, height: image.height }}
                    options={{ extract: image.boundingBox }}
                  />
                  <Square
                    className="absolute inset-0 w-full h-full blur-2xl"
                    src={image.url}
                    image={{ width: image.width, height: image.height }}
                    options={{
                      extract: image.boundingBox,
                      width: 25,
                      height: 25
                    }}
                  />
                </div>
              </Slide>
            ))}
            <SlidePips className="bottom-3" />
          </div>
          <div className="mt-3 min-w-0">
            <p className="truncate text-lg font-semibold leading-tight text-accent-900 transition group-hover:text-accent-700">
              {identification.nickname}
            </p>
          </div>
        </Link>
        <UserLink
          user={identification.suggester}
          className="mt-1 block truncate text-sm font-medium text-accent-800/70 transition hover:text-accent-900 hover:opacity-100"
        />
      </Polaroid>
    </div>
  );
};

export const ConfirmedObservationFeedCard: FC<ConfirmedObservationFeedCardProps> = ({ observation, className }) => {
  return (
    <IdentificationFeedCard
      observedAt={observation.observedAt}
      identification={observation.confirmedIdentification}
      images={observation.sightings.flatMap(sighting => sighting.images)}
      className={className}
    />
  );
};
