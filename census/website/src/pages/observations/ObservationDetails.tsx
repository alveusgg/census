import { Button } from '@/components/controls/button/paper';
import { INatTaxaInput } from '@/components/forms/inputs/INatTaxaInput';
import SiCheckmark from '@/components/icons/SiCheckmark';
import SiChevronDown from '@/components/icons/SiChevronDown';
import SiChevronUp from '@/components/icons/SiChevronUp';
import SiLeaf from '@/components/icons/SiLeaf';
import SiPin from '@/components/icons/SiPin';
import { Loader } from '@/components/loaders/Loader';
import { Confirm, useConfirm } from '@/components/modal/Confirm';
import { useModal } from '@/components/modal/useModal';
import { PanoLocationModal, type PanoLocationModalProps } from '@/components/pano/PanoLocationModal';
import { UserLink } from '@/components/users/UserLink';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSuggestAccessoryIdentification, useSuggestIdentification } from '@/services/api/identifications';
import { useMe } from '@/services/api/me';
import {
  type Identification as IdentificationType,
  type Observation as ObservationType,
  useConfirmObservationWithoutAccessoryIdentification
} from '@/services/api/observations';
import { useHasPermission } from '@/services/permissions/hooks';
import { cn } from '@/utils/cn';
import { useSuspenseQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { type FC, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getMinimizedTree, Node } from './helpers';
import { IdentificationSuggestion } from './IdentificationSuggestion';
import { useCurrentObservation } from './ObservationContext';

const PLANT_TAXON_ID = 47126;

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
    const parent = nodes.find(candidate => candidate.id === node.data.alternateForId);
    if (!parent) throw new Error('Parent not found');
    parent.add(node);
  });

  nodes.forEach(node => {
    if (!node.isRoot()) return;
    const parent = findClosestAncestor(node, nodes);
    if (parent) parent.add(node);
  });

  return nodes.filter(node => node.isRoot());
};

const getUserAgreementId = (identifications: IdentificationType[], userId: number) => {
  return identifications.find(identification =>
    identification.feedback.some(feedback => feedback.userId === userId && feedback.type === 'agree')
  )?.id;
};

export const ObservationDetails: FC<{ className?: string }> = ({ className }) => {
  const observation = useCurrentObservation();
  const { data: me } = useSuspenseQuery(useMe());
  const suggestIdentification = useSuggestIdentification();
  const suggestAccessoryIdentification = useSuggestAccessoryIdentification();
  const confirmObservationWithoutAccessoryIdentification = useConfirmObservationWithoutAccessoryIdentification();
  const canSuggest = useHasPermission('suggest');
  const canModerate = useHasPermission('moderate');
  const isMobile = useIsMobile();
  const confirmWithoutIdentification = useConfirm();
  const locationModal = useModal<PanoLocationModalProps>();

  const accessoryIdentifications = observation.identifications.filter(identification => identification.isAccessory);
  const confirmedAccessoryIdentification = accessoryIdentifications.find(identification => identification.confirmedBy);
  const identificationIdentifications = observation.identifications.filter(
    identification => !identification.isAccessory
  );
  const confirmedPrimaryIdentification = identificationIdentifications.find(
    identification => identification.id === observation.confirmedAs && identification.confirmedBy
  );
  const canConfirmWithoutAccessoryIdentification =
    canModerate && Boolean(confirmedPrimaryIdentification) && !confirmedAccessoryIdentification;
  const observationImages = observation.sightings.flatMap(sighting => sighting.images);
  const submittedTaxonIds = useMemo(
    () => new Set(observation.identifications.map(identification => identification.sourceId)),
    [observation.identifications]
  );
  const accessoryTree = useMemo(() => buildIdentificationTree(accessoryIdentifications), [accessoryIdentifications]);
  const currentAccessoryAgreementId = useMemo(
    () => getUserAgreementId(accessoryIdentifications, me.id),
    [accessoryIdentifications, me.id]
  );
  const tree = useMemo(() => buildIdentificationTree(identificationIdentifications), [identificationIdentifications]);
  const currentIdentificationAgreementId = useMemo(
    () => getUserAgreementId(identificationIdentifications, me.id),
    [identificationIdentifications, me.id]
  );

  return (
    <div className={cn('flex flex-col divide-y divide-accent/50', className)}>
      <Confirm {...confirmWithoutIdentification} />
      {!isMobile && <PanoLocationModal {...locationModal} />}
      {canSuggest && !isMobile && (
        <button
          type="button"
          className="flex w-full cursor-pointer items-center gap-2 px-3 py-1 transition-colors duration-100 hover:bg-accent-100"
          onClick={() =>
            locationModal.open({
              observationId: observation.id,
              location: observation.location ?? undefined
            })
          }
        >
          <SiPin className="text-2xl" />
          {observation.location ? (
            <span className="py-1.5 text-left text-sm font-medium text-accent-800 opacity-75">
              location picked by {observation.location.x.toFixed(2)} {observation.location.y.toFixed(2)}
            </span>
          ) : (
            <span className="py-1.5 text-left text-sm font-medium text-accent-800 opacity-75">pick location</span>
          )}
        </button>
      )}
      {(accessoryTree.length > 0 || canConfirmWithoutAccessoryIdentification) && (
        <div className="flex items-center justify-between">
          <motion.div className="flex w-full flex-col gap-1 py-3">
            <AnimatePresence initial={false}>
              <label className="flex items-center gap-1 pl-3 text-sm font-medium">
                <SiLeaf className="text-xl" />
                associated plants
              </label>
              {confirmedAccessoryIdentification ? (
                <ConfirmedAccessoryIdentification identification={confirmedAccessoryIdentification} />
              ) : (
                <>
                  {accessoryTree.map(identification => (
                    <TopLevelIdentificationTree
                      key={identification.id}
                      observationImages={observationImages}
                      tree={identification}
                      currentAgreementId={currentAccessoryAgreementId}
                    />
                  ))}
                  {canConfirmWithoutAccessoryIdentification && (
                    <div className="mx-3 py-1">
                      <Button
                        compact
                        loading={confirmObservationWithoutAccessoryIdentification.isPending}
                        onClick={() =>
                          confirmWithoutIdentification.open({
                            title: 'Confirm without identification?',
                            description:
                              'This will confirm the observation without an associated plant identification.',
                            onConfirm: async () => {
                              await confirmObservationWithoutAccessoryIdentification.mutateAsync(observation.id);
                            }
                          })
                        }
                        className="gap-1"
                        variant="primary"
                      >
                        <SiCheckmark className="text-lg" />
                        confirm without identification
                      </Button>
                    </div>
                  )}
                </>
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
            taxonId={PLANT_TAXON_ID}
            onSelect={async taxon => {
              if (submittedTaxonIds.has(taxon.id.toString())) {
                toast.error('This taxon has already been suggested for this observation.');
                return;
              }

              await suggestAccessoryIdentification.mutateAsync({
                observationId: observation.id,
                iNatId: taxon.id
              });
            }}
          />
          {suggestAccessoryIdentification.isPending && <Loader className="absolute right-3 top-1/2 -translate-y-1/2" />}
        </div>
      )}
      {tree.length > 0 && (
        <motion.div className="flex flex-col gap-1 px-1 py-3">
          <AnimatePresence initial={false}>
            {tree.map(identification => (
              <TopLevelIdentificationTree
                key={identification.id}
                observationImages={observationImages}
                tree={identification}
                currentAgreementId={currentIdentificationAgreementId}
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
              if (submittedTaxonIds.has(taxon.id.toString())) {
                toast.error('This taxon has already been suggested for this observation.');
                return;
              }

              await suggestIdentification.mutateAsync({
                observationId: observation.id,
                iNatId: taxon.id
              });
            }}
          />
          {suggestIdentification.isPending && <Loader className="absolute right-3 top-1/2 -translate-y-1/2" />}
        </motion.div>
      )}
    </div>
  );
};

const ConfirmedAccessoryIdentification: FC<{ identification: IdentificationType }> = ({ identification }) => {
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

interface TopLevelIdentificationTreeProps {
  observationImages: ObservationType['sightings'][number]['images'];
  tree: Node<IdentificationType>;
  currentAgreementId?: number;
}

const TopLevelIdentificationTree: FC<TopLevelIdentificationTreeProps> = ({
  observationImages,
  tree,
  currentAgreementId
}) => {
  const minimizedTree = getMinimizedTree(tree);
  const [expanded, setExpanded] = useState(false);
  const treeToRender = expanded ? tree : minimizedTree;

  return (
    <div>
      {minimizedTree.id !== tree.id && (
        <button className="mx-1 flex items-center text-sm text-accent-900" onClick={() => setExpanded(!expanded)}>
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
        <IdentificationSuggestion
          observationImages={observationImages}
          tree={treeToRender}
          currentAgreementId={currentAgreementId}
        />
      </div>
    </div>
  );
};
