import { Square } from "@/components/assets/images/Square";
import type { ConfirmedObservation } from "@/services/api/observations";
import { cn } from "@/utils/cn";
import { format } from "date-fns";
import { FC } from "react";
import { Link } from "react-router-dom";
import { SlidePips } from "../observations/gallery/Controls";
import { Slide } from "../observations/gallery/GalleryProvider";
import { Polaroid } from "../observations/gallery/Polaroid";
import { Preloader } from "../observations/Observations";

interface ConfirmedObservationFeedCardProps {
  observation: ConfirmedObservation;
  className?: string;
}

export const ConfirmedObservationFeedCard: FC<ConfirmedObservationFeedCardProps> = ({
  observation,
  className,
}) => {
  const images = observation.sightings.flatMap((sighting) => sighting.images);
  const confirmed = observation.confirmedIdentification;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm opacity-70 whitespace-nowrap">
          {format(new Date(observation.observedAt), "h:mma")}
        </span>
        <div className="flex-1 border-t border-dashed border-accent-300" />
      </div>
      <Link to={`/identifications/${confirmed.id}`} className="block">
        <Polaroid className="flex flex-col p-4">
          <div className="relative aspect-square w-full">
            <Preloader>
              {images.map((image) => (
                <Square
                  key={image.id}
                  src={image.url}
                  image={{ width: image.width, height: image.height }}
                  options={{ extract: image.boundingBox }}
                />
              ))}
            </Preloader>
            {images.map((image) => (
              <Slide key={image.id} id={image.id.toString()}>
                <div className="w-full h-full overflow-clip relative">
                  <Square
                    loading="lazy"
                    className="absolute inset-0 w-full h-full z-10"
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
                      height: 25,
                    }}
                  />
                </div>
              </Slide>
            ))}
            <SlidePips />
          </div>
          <div className="mt-2 min-h-0">
            <p className="font-semibold text-accent-900 truncate">{confirmed.nickname}</p>
            <p className="text-sm opacity-70 text-accent-800 truncate">
              {confirmed.suggester.username}
            </p>
          </div>
        </Polaroid>
      </Link>
    </div>
  );
};
