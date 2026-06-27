import { Square } from '@/components/assets/images/Square';
import { Note } from '@/components/containers/Note';
import { Button, Link } from '@/components/controls/button/paper';
import { Preloader } from '@/components/feed/Preloader';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/forms/base/dropdown-menu';
import { INatTaxaInput } from '@/components/forms/inputs/INatTaxaInput';
import { Loader } from '@/components/loaders/Loader';
import { Spinner } from '@/components/loaders/Spinner';
import { Confirm, useConfirm } from '@/components/modal/Confirm';
import { Timestamp } from '@/components/text/Timestamp';
import { UserLink } from '@/components/users/UserLink';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSuggestAccessoryIdentification, useSuggestIdentification } from '@/services/api/identifications';
import {
  Identification as IdentificationType,
  Observation as ObservationType,
  useDeleteObservation
} from '@/services/api/observations';
import { useHasPermission } from '@/services/permissions/hooks';
import { cn } from '@/utils/cn';
import { formatInTimeZone } from 'date-fns-tz';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, useMemo, useState } from 'react';
import { Slide } from './gallery/GalleryProvider';
import { Polaroid } from './gallery/Polaroid';
import { IdentificationSuggestion } from './IdentificationSuggestion';

import { useModal } from '@/components/modal/useModal';
import type { PanoLocationModalProps } from '@/components/pano/PanoLocationModal';
import { PanoLocationModal } from '@/components/pano/PanoLocationModal';

import SiChevronDown from '@/components/icons/SiChevronDown';
import SiChevronUp from '@/components/icons/SiChevronUp';
import SiCheckmark from '@/components/icons/SiCheckmark';
import SiLeaf from '@/components/icons/SiLeaf';
import SiPin from '@/components/icons/SiPin';
import SiTrash from '@/components/icons/SiTrash';
import SiTwitch from '@/components/icons/SiTwitch';
import { Controls, SlidePips } from './gallery/Controls';
import { getMinimizedTree, Node } from './helpers';

interface ObservationProps {
  observation: ObservationType;
}

const findClosestAncestor = (node: Node<IdentificationType>, nodes: Node<IdentificationType>[]) => {
  const ancestors = node.data.sourceAncestorIds.map(id => id.toString());
  return nodes.reduce<Node<IdentificationType> | undefined>((closest, current) => {
    if (current.id === node.id) return closest;
    const ancestorIndex = ancestors.findIndex(sourceId => sourceId === current.data.sourceId);
    if (ancestorIndex === -1) return closest;
    if (!closest) return current;

    const closestIndex = ancestors.findIndex(sourceId => sourceId === closest.data.sourceId);
    return ancestorIndex > closestIndex ? current : closest;
  }, undefined);
};

const buildIdentificationTree = (identifications: IdentificationType[]) => {
  const nodes = identifications.map(identification => new Node(identification.id, identification));

  nodes.forEach(node => {
    if (!node.data.alternateForId) return;
    const parent = nodes.find(n => n.id === node.data.alternateForId);
    if (!parent) throw new Error('Parent not found');
    parent.add(node);
  });

  nodes.forEach(node => {
    if (!node.isRoot()) return;
    const parent = findClosestAncestor(node, nodes);
    if (!parent) return;
    parent.add(node);
  });

  return nodes.filter(node => node.isRoot());
};

const UserLinkList: FC<{ users: { id: number; username: string }[] }> = ({ users }) => {
  return (
    <>
      {users.map((user, index) => (
        <span key={`${user.id}-${index}`}>
          {index > 0 && ', '}
          <UserLink user={user} />
        </span>
      ))}
    </>
  );
};

interface ObservationImageProps {
  image: ObservationType['sightings'][number]['images'][number];
}

const ObservationImage: FC<ObservationImageProps> = ({ image }) => {
  const [hasLoadedHighResolutionImage, setHasLoadedHighResolutionImage] = useState(false);
  const isProcessingImages = !hasLoadedHighResolutionImage;

  return (
    <div className="w-full h-full overflow-clip relative">
      {isProcessingImages && (
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
        className="absolute inset-0 z-[2] w-full h-full"
        src={image.url}
        image={{ width: image.width, height: image.height }}
        options={{ extract: image.boundingBox }}
        onLoad={() => setHasLoadedHighResolutionImage(true)}
      />
    </div>
  );
};

export const Observation: FC<ObservationProps> = ({ observation }) => {
  const suggestIdentification = useSuggestIdentification();
  const suggestAccessoryIdentification = useSuggestAccessoryIdentification();
  const deleteObservation = useDeleteObservation();
  const canSuggest = useHasPermission('suggest');
  const canModerate = useHasPermission('moderate');
  const isMobile = useIsMobile();
  const confirmDelete = useConfirm();
  const locationModal = useModal<PanoLocationModalProps>();

  const accessoryIdentifications = observation.identifications.filter(identification => identification.isAccessory);
  const confirmedAccessoryIdentification = accessoryIdentifications.find(identification => identification.confirmedBy);
  const identificationIdentifications = observation.identifications.filter(
    identification => !identification.isAccessory
  );
  const observationImages = observation.sightings.flatMap(sighting => sighting.images);

  const accessoryTree = useMemo(() => {
    return buildIdentificationTree(accessoryIdentifications);
  }, [accessoryIdentifications]);

  const tree = useMemo(() => {
    return buildIdentificationTree(identificationIdentifications);
  }, [identificationIdentifications]);

  return (
    <div className="@container">
      <Confirm {...confirmDelete} />
      {!isMobile && <PanoLocationModal {...locationModal} />}
      <div className="flex gap-4 flex-col @lg:flex-row" key={observation.id}>
        <Polaroid>
          <Preloader>
            {observationImages.map(image => (
              <Square
                key={image.id}
                src={image.url}
                image={{ width: image.width, height: image.height }}
                options={{ extract: image.boundingBox }}
              />
            ))}
          </Preloader>
          {observationImages.map(image => (
            <Slide key={image.id} id={image.id.toString()}>
              <ObservationImage image={image} />
            </Slide>
          ))}
          <Controls />
          <SlidePips />
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
                <UserLinkList users={observation.sightings.flatMap(sighting => sighting.observer)} />
              </p>
              <p className="text-sm">
                captured by{' '}
                <UserLinkList users={observation.sightings.flatMap(sighting => sighting.capture.capturer)} />
              </p>
            </div>
            <div className="flex gap-2">
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
          {canSuggest && !isMobile && (
            <button
              type="button"
              className="px-3 py-1 flex gap-2 items-center w-full transition-colors duration-100 hover:bg-accent-100 cursor-pointer"
              onClick={() =>
                locationModal.open({
                  observationId: observation.id,
                  location: observation.location ?? undefined
                })
              }
            >
              <SiPin className="text-2xl" />
              {observation.location ? (
                <span className="py-1.5 text-sm text-left text-accent-800 opacity-75 font-medium">
                  location picked by {observation.location.x.toFixed(2)} {observation.location.y.toFixed(2)}
                </span>
              ) : (
                <span className="py-1.5 text-sm text-left text-accent-800 opacity-75 font-medium">pick location</span>
              )}
            </button>
          )}
          {accessoryTree.length > 0 && (
            <div className="flex justify-between items-center">
              <motion.div className="py-3  flex flex-col gap-1 w-full">
                <AnimatePresence initial={false}>
                  <label className="flex pl-3 items-center gap-1 text-sm font-medium">
                    <SiLeaf className="text-xl" />
                    associated plants
                  </label>
                  {confirmedAccessoryIdentification ? (
                    <ConfirmedAccessoryIdentification identification={confirmedAccessoryIdentification} />
                  ) : (
                    accessoryTree.map(identification => (
                      <TopLevelIdentificationTree
                        key={identification.id}
                        observationImages={observationImages}
                        tree={identification}
                      />
                    ))
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
          {canSuggest && !confirmedAccessoryIdentification && (
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
                  <TopLevelIdentificationTree
                    key={identification.id}
                    observationImages={observationImages}
                    tree={identification}
                  />
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
  observationImages: ObservationType['sightings'][number]['images'];
  tree: Node<IdentificationType>;
}

const ConfirmedAccessoryIdentification: FC<{
  identification: IdentificationType;
}> = ({ identification }) => {
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mx-3 py-1">
      <div className="flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50/80 px-3 py-2">
        <div className="min-w-0 leading-tight">
          <a
            href={`https://www.inaturalist.org/taxa/${identification.sourceId}`}
            target="_blank"
            className="flex min-w-0 items-center gap-1 font-semibold text-accent-900"
          >
            <SiLeaf className="shrink-0 text-xl text-green-700" />
            <span className="truncate">{identification.name}</span>
          </a>
          <p className="text-sm text-accent-800">
            suggested by <UserLink user={identification.suggester} className="font-semibold" />
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-700 px-2 py-0.5 text-xs font-bold text-white">
          <SiCheckmark className="text-sm" />
          confirmed
        </span>
      </div>
    </motion.div>
  );
};

const TopLevelIdentificationTree: FC<TopLevelIdentificationTreeProps> = ({ observationImages, tree }) => {
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
        <IdentificationSuggestion observationImages={observationImages} tree={treeToRender} />
      </div>
    </div>
  );
};
