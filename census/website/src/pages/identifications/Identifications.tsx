import { Square } from '@/components/assets/images/Square';
import { Button } from '@/components/controls/button/paper';
import { SelectionActionBar, SelectionCount } from '@/components/selection/SelectionActionBar';
import { SelectionContainer } from '@/components/selection/SelectionContainer';
import { useSelection } from '@/components/selection/SelectionProvider';
import { useIdentificationsGroupedBySource, useImagesForObservationId } from '@/services/api/identifications';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Outlet } from 'react-router';
import { Link } from 'react-router-dom';
import { Preloader } from '../observations/Observations';
import { Slide } from '../observations/gallery/GalleryProvider';
import { Polaroid } from '../observations/gallery/Polaroid';

export const Identifications = () => {
  const query = useIdentificationsGroupedBySource();
  const identificationsGroupedBySource = useSuspenseQuery(query);
  const imageQuery = useImagesForObservationId(identificationsGroupedBySource.data[0].observationIds[0]);
  const images = useSuspenseQuery(imageQuery);

  const { clearSelection } = useSelection();

  return (
    <>
      <Outlet />
      <div className="w-full @container">
        <div className="grid grid-cols-5 gap-8 pt-12">
          {identificationsGroupedBySource.data.map(identification => (
            <SelectionContainer id={identification.sourceId} key={identification.sourceId}>
              <div key={identification.sourceId}>
                <Polaroid className="p-3">
                  <Preloader>
                    {images.data.map(image => (
                      <Square
                        key={image.id}
                        src={image.url}
                        image={{ width: image.width, height: image.height }}
                        options={{ extract: image.boundingBox }}
                      />
                    ))}
                  </Preloader>
                  {images.data.map((image: any) => (
                    <Slide key={image.id} id={image.id.toString()}>
                      <div className="w-full h-full overflow-clip relative rounded-sm">
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
                          options={{ extract: image.boundingBox, width: 25, height: 25 }}
                        />
                      </div>
                    </Slide>
                  ))}
                  <Link to={`/identifications/1`}>{identification.name}</Link>
                </Polaroid>
              </div>
            </SelectionContainer>
          ))}
        </div>
      </div>
      <SelectionActionBar className="justify-between">
        <SelectionCount singular="identification" />
        <div className="flex gap-2">
          <Button compact onClick={clearSelection}>
            clear
          </Button>
        </div>
      </SelectionActionBar>
    </>
  );
};
