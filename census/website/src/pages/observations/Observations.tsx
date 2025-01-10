import { Square } from '@/components/assets/images/Square';
import { Note } from '@/components/containers/Note';
import { Button, Link } from '@/components/controls/button/paper';
import { INatTaxaInput } from '@/components/forms/inputs/INatTaxaInput';
import SiBug2 from '@/components/icons/SiBug2';
import SiCamera from '@/components/icons/SiCamera';
import SiDiscord from '@/components/icons/SiDiscord';
import SiLeaf from '@/components/icons/SiLeaf';
import SiSearch from '@/components/icons/SiSearch';
import SiTwitch from '@/components/icons/SiTwitch';
import { Loader } from '@/components/loaders/Loader';
import { useModal } from '@/components/modal/useModal';
import { Timestamp } from '@/components/text/Timestamp';
import { useSuggestIdentification } from '@/services/api/identifications';
import { useNotifyDiscordAboutObservation, useObservations } from '@/services/api/observations';
import { useUser } from '@/services/authentication/hooks';
import { useHasPermission } from '@/services/permissions/hooks';
import { cn } from '@/utils/cn';
import { formatInTimeZone } from 'date-fns-tz';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Slide } from './gallery/GalleryProvider';
import { Polaroid } from './gallery/Polaroid';
import { IdentificationFeedbackModal, IdentificationFeedbackModalProps } from './ObservationFeedbackModal';

export type Observation = NonNullable<
  NonNullable<ReturnType<typeof useObservations>>['data']
>['pages'][number]['data'][number];

export type Identification = Observation['identifications'][number];

type NestedIdentification = Identification & {
  children?: NestedIdentification[];
};

const calculateTreeFromIdentifications = (identifications: NestedIdentification[]) => {
  const topLevelIdentifications = new Set<NestedIdentification>();
  const childrenForParent = new Map<number, NestedIdentification[]>();

  for (const id of identifications) {
    if (!id.alternateForId) {
      topLevelIdentifications.add(id);
      continue;
    }
    const children = childrenForParent.get(id.alternateForId) ?? [];
    childrenForParent.set(id.alternateForId, [...children, id]);
  }

  return { topLevelIdentifications, childrenForParent } as const;
};

interface IdentificationProps {
  identification: NestedIdentification;
  map: Map<number, NestedIdentification[]>;
}

const Identification: FC<IdentificationProps> = ({ identification, map }) => {
  const me = useUser();
  const identificationFeedbackModalProps = useModal<IdentificationFeedbackModalProps>();
  const canVote = useHasPermission('vote');
  const children = map.get(identification.id);
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-3 py-1 flex flex-col gap-1"
      key={identification.id}
    >
      <IdentificationFeedbackModal {...identificationFeedbackModalProps} />
      <div>
        <p className="font-semibold flex items-center gap-1">
          <SiBug2 className="text-xl" />
          <span>{identification.name}</span>
        </p>
        <p className="text-sm">
          suggested by <span className="font-semibold">{identification.suggester.username}</span>
        </p>
      </div>
      {canVote && !identification.feedback.find(feedback => feedback.userId === me.id) && (
        <div className="flex gap-2 items-center">
          <Button
            onClick={() => identificationFeedbackModalProps.open({ feedback: 'agree', identification })}
            className="text-sm font-semibold px-2.5 py-1"
            variant="primary"
          >
            agree
          </Button>
          <Button
            onClick={() => identificationFeedbackModalProps.open({ feedback: 'disagree', identification })}
            className="text-sm font-semibold px-2.5 py-1"
            variant="primary"
          >
            disagree
          </Button>
        </div>
      )}
      {children && children.length > 0 && (
        <div className="ml-2">
          {children.map(child => {
            return <Identification identification={child} map={map} />;
          })}
        </div>
      )}
    </motion.div>
  );
};

const Observation: FC<{ observation: Observation }> = ({ observation }) => {
  const notifyDiscordAboutObservation = useNotifyDiscordAboutObservation();
  const suggestIdentification = useSuggestIdentification();
  const canSuggest = useHasPermission('suggest');
  const canCapture = useHasPermission('capture');

  // const accessoryIdentifications = observation.identifications.filter(identification => identification.isAccessory);
  const observationIdentifications = observation.identifications.filter(identification => !identification.isAccessory);
  const { topLevelIdentifications, childrenForParent } = useMemo(
    () => calculateTreeFromIdentifications(observationIdentifications),
    [observationIdentifications]
  );

  const [accessorySuggestionEnabled, setAccessorySuggestionEnabled] = useState(false);

  return (
    <div className="@container">
      <div className="flex gap-4 flex-col @lg:flex-row" key={observation.id}>
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
                  options={{ extract: image.boundingBox, width: 25, height: 25 }}
                />
              </div>
            </Slide>
          ))}
        </Polaroid>
        <Note className="w-full h-fit">
          <div className="pb-2 pt-4 px-4 flex gap-6 justify-between">
            <div className="font-mono mb-1">
              <p className="text-lg font-semibold">{observation.observer.username}</p>
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
              {observation.discordThreadId && (
                <Link
                  variant={false}
                  target="_blank"
                  rel="noreferrer"
                  to={`https://discord.com/channels/943622444852330518/${observation.discordThreadId}`}
                  className={cn(
                    'rounded-full w-10 h-10 p-1 flex items-center justify-center text-blue-800 bg-blue-100 hover:bg-blue-200'
                  )}
                >
                  <SiDiscord className="text-2xl" />
                </Link>
              )}
              {!observation.discordThreadId && canCapture && (
                <Button
                  variant={false}
                  onClick={() => notifyDiscordAboutObservation.mutate(observation.id)}
                  loading={notifyDiscordAboutObservation.isPending}
                  className={cn(
                    'rounded-full w-10 h-10 p-1 flex items-center justify-center text-blue-500 bg-blue-50 hover:bg-blue-100'
                  )}
                >
                  <SiDiscord className="text-2xl" />
                </Button>
              )}
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
          <div className="py-2 px-3 flex justify-between items-center">
            <p className="flex items-center gap-2 text-sm font-medium opacity-50">
              <SiLeaf className="text-xl" />
              no associated plants
            </p>
            {canSuggest && (
              <Button
                variant="primary"
                onClick={() => setAccessorySuggestionEnabled(true)}
                className="text-sm font-semibold pl-2 pr-2.5 py-1 gap-0.5"
              >
                <SiSearch className="text-base" />
                suggest
              </Button>
            )}
          </div>
          {accessorySuggestionEnabled && (
            <div>
              <INatTaxaInput
                autoOpen
                placeholder="suggest plant"
                onSelect={async taxon => {
                  await suggestIdentification.mutateAsync({
                    observationId: observation.id,
                    iNatId: taxon.id
                  });
                }}
              />
            </div>
          )}
          {topLevelIdentifications.size > 0 && (
            <motion.div className="py-2">
              <AnimatePresence initial={false}>
                {Array.from(topLevelIdentifications).map(identification => {
                  return <Identification identification={identification} map={childrenForParent} />;
                })}
              </AnimatePresence>
            </motion.div>
          )}
          {canSuggest && (
            <motion.div className="relative">
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
            </motion.div>
          )}
        </Note>
      </div>
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
