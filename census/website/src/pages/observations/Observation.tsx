import { Square } from '@/components/assets/images/Square';
import { Note } from '@/components/containers/Note';
import { Button, Link } from '@/components/controls/button/paper';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/forms/base/dropdown-menu';
import { INatTaxaInput } from '@/components/forms/inputs/INatTaxaInput';
import { Loader } from '@/components/loaders/Loader';
import { Timestamp } from '@/components/text/Timestamp';
import { Confirm, useConfirm } from '@/components/modal/Confirm';
import { useSuggestAccessoryIdentification, useSuggestIdentification } from '@/services/api/identifications';
import {
  Identification as IdentificationType,
  Observation as ObservationType,
  useDeleteObservation,
  useNotifyDiscordAboutObservation
} from '@/services/api/observations';
import { useHasPermission } from '@/services/permissions/hooks';
import { cn } from '@/utils/cn';
import { formatInTimeZone } from 'date-fns-tz';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, useMemo, useState } from 'react';
import { Slide } from './gallery/GalleryProvider';
import { Polaroid } from './gallery/Polaroid';
import { IdentificationSuggestion } from './IdentificationSuggestion';

import SiChevronDown from '@/components/icons/SiChevronDown';
import SiChevronUp from '@/components/icons/SiChevronUp';
import SiDiscord from '@/components/icons/SiDiscord';
import SiLeaf from '@/components/icons/SiLeaf';
import SiTrash from '@/components/icons/SiTrash';
import SiTwitch from '@/components/icons/SiTwitch';
import { Controls } from './gallery/Controls';
import { getMinimizedTree, Node } from './helpers';
import { Preloader } from './Observations';

interface ObservationProps {
  observation: ObservationType;
}

export const Observation: FC<ObservationProps> = ({ observation }) => {
  const notifyDiscordAboutObservation = useNotifyDiscordAboutObservation();
  const suggestIdentification = useSuggestIdentification();
  const suggestAccessoryIdentification = useSuggestAccessoryIdentification();
  const deleteObservation = useDeleteObservation();
  const canSuggest = useHasPermission('suggest');
  const canCapture = useHasPermission('capture');
  const canModerate = useHasPermission('moderate');
  const confirmDelete = useConfirm();

  const accessoryIdentifications = observation.identifications.filter(identification => identification.isAccessory);
  const identificationIdentifications = observation.identifications.filter(
    identification => !identification.isAccessory
  );

  const accessoryTree = useMemo(() => {
    const nodes = accessoryIdentifications.map(identification => new Node(identification.id, identification));
    nodes.forEach(node => {
      if (!node.data.alternateForId) return;
      const parent = nodes.find(n => n.id === node.data.alternateForId);
      if (!parent) throw new Error('Parent not found');
      parent.add(node);
    });
    return nodes.filter(node => node.isRoot());
  }, [accessoryIdentifications]);

  const tree = useMemo(() => {
    const nodes = identificationIdentifications.map(identification => new Node(identification.id, identification));
    nodes.forEach(node => {
      if (!node.data.alternateForId) return;
      const parent = nodes.find(n => n.id === node.data.alternateForId);
      if (!parent) throw new Error('Parent not found');
      parent.add(node);
    });
    return nodes.filter(node => node.isRoot());
  }, [identificationIdentifications]);

  return (
    <div className="@container">
      <Confirm {...confirmDelete} />
      <div className="flex gap-4 flex-col @lg:flex-row" key={observation.id}>
        <Polaroid>
          <Preloader>
            {observation.images.map(image => (
              <Square
                key={image.id}
                src={image.url}
                image={{ width: image.width, height: image.height }}
                options={{ extract: image.boundingBox }}
              />
            ))}
          </Preloader>
          {observation.images.map(image => (
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
                  options={{ extract: image.boundingBox, width: 25, height: 25 }}
                />
              </div>
            </Slide>
          ))}
          <Controls />
        </Polaroid>
        <Note className="w-full h-fit">
          <div className="pb-2 pt-4 px-4 flex gap-6 justify-between">
            <div className="font-mono mb-1">
              <p className="text-sm">
                <Timestamp date={new Date(observation.observedAt)}>
                  {formatInTimeZone(observation.observedAt, 'America/Chicago', 'MM/dd/yyyy hh:mma')}
                </Timestamp>
              </p>
              <p className="text-sm">observed by</p>
              <p className="text-lg font-semibold">
                {observation.credits.observedBy.map(user => user.username).join(', ')}
              </p>
              <p className="text-sm">
                captured by {observation.credits.capturedBy.map(user => user.username).join(', ')}
              </p>
            </div>
            <div className="flex gap-2">
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
              {(() => {
                const clipIds = Object.keys(
                  Object.groupBy(
                    observation.sightings.filter(sighting => Boolean(sighting.capture.clipId)),
                    sighting => sighting.capture.clipId
                  )
                );
                if (clipIds.length === 0) return null;
                if (clipIds.length === 1) {
                  return (
                    <Link
                      target="_blank"
                      rel="noreferrer"
                      to={`https://clips.twitch.tv/${clipIds[0]}`}
                      variant={false}
                      className="rounded-full w-10 h-10 p-1 flex items-center justify-center text-purple-800 bg-purple-700 bg-opacity-10 hover:bg-opacity-20"
                    >
                      <SiTwitch className="text-2xl" />
                    </Link>
                  );
                }
                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label="twitch clips"
                      className="rounded-full w-10 h-10 p-1 flex items-center justify-center text-purple-800 bg-purple-700 bg-opacity-10 hover:bg-opacity-20"
                    >
                      <SiTwitch className="text-2xl" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {clipIds.map((clipId, index) => (
                        <DropdownMenuItem key={clipId} asChild>
                          <a href={`https://clips.twitch.tv/${clipId}`} target="_blank" rel="noreferrer">
                            <SiTwitch className="text-lg" />
                            Clip #{index + 1}
                          </a>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })()}
              {canModerate && (
                <Button
                  variant={false}
                  aria-label="delete observation"
                  onClick={() =>
                    confirmDelete.open({
                      title: 'Delete observation?',
                      description: 'This will permanently delete this observation. This action cannot be undone.',
                      onConfirm: async () => {
                        await deleteObservation.mutateAsync(observation.id);
                      }
                    })
                  }
                  loading={deleteObservation.isPending}
                  className={cn(
                    'rounded-full w-10 h-10 p-1 flex items-center justify-center text-red-800 bg-red-100 hover:bg-red-200'
                  )}
                >
                  <SiTrash className="text-2xl" />
                </Button>
              )}
            </div>
          </div>
          {accessoryTree.length > 0 && (
            <div className="flex justify-between items-center">
              <motion.div className="py-3  flex flex-col gap-1 w-full">
                <AnimatePresence initial={false}>
                  <label className="flex pl-3 items-center gap-1 text-sm font-medium">
                    <SiLeaf className="text-xl" />
                    associated plants
                  </label>
                  {accessoryTree.map(identification => (
                    <TopLevelIdentificationTree key={identification.id} tree={identification} />
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
          {canSuggest && (
            <div>
              <INatTaxaInput
                icon={<SiLeaf className="text-2xl" />}
                placeholder="suggest plant"
                onSelect={async taxon => {
                  await suggestAccessoryIdentification.mutateAsync({
                    observationId: observation.id,
                    iNatId: taxon.id
                  });
                }}
              />
              {suggestAccessoryIdentification.isPending && (
                <Loader className="absolute top-1/2 -translate-y-1/2 right-3" />
              )}
            </div>
          )}
          {tree.length > 0 && (
            <motion.div className="py-3 px-1 flex flex-col gap-1">
              <AnimatePresence initial={false}>
                {tree.map(identification => (
                  <TopLevelIdentificationTree key={identification.id} tree={identification} />
                ))}
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

interface TopLevelIdentificationTreeProps {
  tree: Node<IdentificationType>;
}

const TopLevelIdentificationTree: FC<TopLevelIdentificationTreeProps> = ({ tree }) => {
  const minimizedTree = getMinimizedTree(tree);

  const [expanded, setExpanded] = useState(false);
  let treeToRender = expanded ? tree : minimizedTree;

  return (
    <div>
      {minimizedTree.id !== tree.id && (
        <button className="text-sm text-accent-900 mx-1 flex items-center" onClick={() => setExpanded(!expanded)}>
          {expanded ? (
            <>
              <SiChevronUp className="text-2xl" />
              <p>hide families & orders</p>
            </>
          ) : (
            <>
              <SiChevronDown className="text-2xl" />
              <p>show families & orders</p>
            </>
          )}
        </button>
      )}
      <div className="mx-3">
        <IdentificationSuggestion tree={treeToRender} />
      </div>
    </div>
  );
};
