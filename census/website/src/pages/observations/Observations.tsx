import { Square } from '@/components/assets/images/Square';
import { Note } from '@/components/containers/Note';
import { Button, Link } from '@/components/controls/button/paper';
import { INatTaxaInput } from '@/components/forms/inputs/INatTaxaInput';
import SiBug2 from '@/components/icons/SiBug2';
import SiCamera from '@/components/icons/SiCamera';
import SiChevronLeft from '@/components/icons/SiChevronLeft';
import SiChevronRight from '@/components/icons/SiChevronRight';
import SiDiscord from '@/components/icons/SiDiscord';
import SiLeaf from '@/components/icons/SiLeaf';
import SiTwitch from '@/components/icons/SiTwitch';
import { Loader } from '@/components/loaders/Loader';
import { usePointAction } from '@/components/points/hooks';
import { PointOrigin } from '@/components/points/PointOrigin';
import { Timestamp } from '@/components/text/Timestamp';
import { useSuggestIdentification } from '@/services/api/identifications';
import { useObservations } from '@/services/api/observations';
import { Slot } from '@radix-ui/react-slot';
import { formatInTimeZone } from 'date-fns-tz';
import { ComponentProps, FC, PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { GalleryProvider, Slide } from './gallery/GalleryProvider';
import { useGallery } from './gallery/hooks';

interface SlideButtonProps {
  direction: 'next' | 'previous';
}

const SlideButton: FC<PropsWithChildren<SlideButtonProps & ComponentProps<'button'>>> = ({
  direction,
  children,
  ...props
}) => {
  const [next, previous] = useGallery(state => [state.next, state.previous]);
  return (
    <button {...props} onClick={() => (direction === 'next' ? next() : previous())}>
      {children}
    </button>
  );
};

const Controls: FC = () => {
  return (
    <>
      <SlideButton
        direction="previous"
        className="absolute top-1/2 -translate-y-1/2 -left-2 z-10 bg-white border border-accent border-opacity-50 text-accent-darker p-1 rounded-full shadow-xl cursor-pointer"
      >
        <SiChevronLeft className="text-3xl" />
      </SlideButton>
      <SlideButton
        direction="next"
        className="absolute top-1/2 -translate-y-1/2 -right-2 z-10 bg-white border border-accent border-opacity-50 text-accent-darker p-1 rounded-full shadow-xl cursor-pointer"
      >
        <SiChevronRight className="text-3xl" />
      </SlideButton>
    </>
  );
};

const AutoplayOnHover: FC<PropsWithChildren> = ({ children }) => {
  const next = useGallery(state => state.next);
  const ref = useCallback((node: HTMLDivElement) => {
    let isAutoplaying = false;
    if (node) {
      node.addEventListener('mouseenter', () => {
        if (isAutoplaying) return;
        isAutoplaying = true;
        const interval = setInterval(() => {
          next();
        }, 1000);

        node.addEventListener('mouseleave', () => {
          clearInterval(interval);
          isAutoplaying = false;
        });
      });
    }
  }, []);
  return <Slot ref={ref}>{children}</Slot>;
};

export const Polaroid: FC<PropsWithChildren> = ({ children }) => {
  return (
    <GalleryProvider loop>
      <AutoplayOnHover>
        <div className="relative aspect-square w-full max-w-md p-6 bg-white border border-accent border-opacity-50 rounded-md">
          {children}
          <Controls />
        </div>
      </AutoplayOnHover>
    </GalleryProvider>
  );
};

type Observation = NonNullable<
  NonNullable<ReturnType<typeof useObservations>>['data']
>['pages'][number]['data'][number];

const Observation: FC<{ observation: Observation }> = ({ observation }) => {
  const suggestIdentification = useSuggestIdentification();
  const action = usePointAction();

  return (
    <div className="flex gap-4" key={observation.id}>
      <Polaroid>
        <Preloader>
          {observation.images.map(image => (
            <Square key={image.id} src={image.url} options={{ extract: image.boundingBox }} />
          ))}
        </Preloader>
        {observation.images.map(image => (
          <Slide key={image.id} id={image.id.toString()}>
            <div className="w-full h-full overflow-clip relative">
              <Square
                loading="lazy"
                className="absolute inset-0 w-full h-full z-10"
                src={image.url}
                options={{ extract: image.boundingBox }}
              />
              <Square
                className="absolute inset-0 w-full h-full blur-2xl"
                src={image.url}
                options={{ extract: image.boundingBox, width: 50, height: 50 }}
              />
            </div>
          </Slide>
        ))}
      </Polaroid>
      <Note className="w-full h-fit">
        <div className="pb-2 pt-4 px-4 flex gap-6 justify-between">
          <div className="font-mono mb-1">
            <p className="text-lg font-semibold">strangecyan</p>
            <p className="text-sm">
              <Timestamp date={new Date(observation.capture.startCaptureAt)}>
                {formatInTimeZone(observation.capture.startCaptureAt, 'America/Chicago', 'MM/dd/yyyy hh:mma')}
              </Timestamp>
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/captures/${observation.capture.id}`}
              className="rounded-full w-10 h-10 p-1 flex items-center justify-center"
            >
              <SiCamera className="text-2xl" />
            </Link>
            <Button
              variant={false}
              className="rounded-full w-10 h-10 p-1 opacity-50 flex items-center justify-center text-blue-800 bg-blue-700 bg-opacity-10 hover:bg-opacity-20"
            >
              <SiDiscord className="text-2xl" />
            </Button>
            {observation.capture?.clipId && (
              <Link
                target="_blank"
                rel="noreferrer"
                to={`https://clips.twitch.tv/${observation.capture.clipId}`}
                variant={false}
                className="rounded-full w-10 h-10 p-1 flex items-center justify-center text-purple-800 bg-purple-700 bg-opacity-10 hover:bg-opacity-20"
              >
                <SiTwitch className="text-2xl" />
              </Link>
            )}
          </div>
        </div>
        <div className="py-2 px-3 opacity-50">
          <p className="flex items-center gap-2 text-sm font-medium">
            <SiLeaf className="text-xl" />
            no associated plants
          </p>
        </div>
        {observation.identifications.length > 0 && (
          <div className="py-2">
            {observation.identifications.map(identification => (
              <div className="px-3 py-1 flex flex-col gap-1" key={identification.id}>
                <div>
                  <p className="font-semibold flex items-center gap-1">
                    <SiBug2 className="text-xl" />
                    <span>{identification.name}</span>
                  </p>
                  <p className="text-sm">
                    suggested by <span className="font-semibold">{identification.suggestedBy}</span>
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <PointOrigin {...action}>
                    <Button
                      onClick={() => action.add(20)}
                      className="text-sm font-semibold px-2.5 py-1.5"
                      variant="primary"
                    >
                      agree
                    </Button>
                  </PointOrigin>
                  <Button className="text-sm font-semibold px-2.5 py-1.5" variant="primary">
                    disagree
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="relative">
          <INatTaxaInput
            placeholder="suggest identification"
            onSelect={async taxon => {
              await suggestIdentification.mutateAsync({
                observationId: observation.id,
                iNatId: taxon.id
              });
            }}
          />
          {suggestIdentification.isPending && <Loader className="absolute top-1/2 -translate-y-1/2 right-3" />}
        </div>
      </Note>
    </div>
  );
};

export const Observations = () => {
  const result = useObservations();

  return (
    <div className="flex flex-col gap-4 w-full mx-auto max-w-4xl">
      {result.data.pages.flatMap(page => {
        return page.data.map(observation => <Observation key={observation.id} observation={observation} />);
      })}
    </div>
  );
};

export const Preloader: FC<PropsWithChildren> = ({ children }) => {
  const [ref, inView] = useInView();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (hasLoaded) return;
    if (inView) setHasLoaded(true);
  }, [inView, hasLoaded]);

  return (
    <div ref={ref} className="w-0 h-0">
      {hasLoaded && children}
    </div>
  );
};
