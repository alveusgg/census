import { Square } from '@/components/assets/images/Square';
import { useIdentificationsGroupedBySource, useImagesForObservationId } from '@/services/api/identifications';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Outlet } from 'react-router';
import { Preloader } from '../observations/Observations';
import { ClickToMove } from '../observations/gallery/Controls';
import { Slide } from '../observations/gallery/GalleryProvider';
import { Polaroid } from '../observations/gallery/Polaroid';

export const Identifications = () => {
  const query = useIdentificationsGroupedBySource();
  const identificationsGroupedBySource = useSuspenseQuery(query);
  const imageQuery = useImagesForObservationId(identificationsGroupedBySource.data[0].observationIds[0]);
  const images = useSuspenseQuery(imageQuery);

  return (
    <>
      <Outlet />
      <div className="w-full @container">
        <div className="grid grid-cols-5 gap-8 pt-12">
          {identificationsGroupedBySource.data.map(identification => (
            <div key={identification.sourceId}>
              {identification.name}
              <Polaroid className="p-3">
                <Preloader>
                  {images.data.map(image => (
                    <Square key={image.id} src={image.url} options={{ extract: image.boundingBox }} />
                  ))}
                </Preloader>
                {images.data.map((image: any) => (
                  <Slide key={image.id} id={image.id.toString()}>
                    <div className="w-full h-full overflow-clip relative rounded-sm">
                      <Square
                        loading="lazy"
                        className="absolute inset-0 w-full h-full z-10"
                        src={image.url}
                        options={{ extract: image.boundingBox }}
                      />
                      <Square
                        className="absolute inset-0 w-full h-full blur-2xl"
                        src={image.url}
                        options={{ extract: image.boundingBox, width: 25, height: 25 }}
                      />
                    </div>
                  </Slide>
                ))}
                <ClickToMove />
              </Polaroid>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
