import { Button } from '@/components/controls/button/paper';
import { SelectionActionBar, SelectionCount } from '@/components/selection/SelectionActionBar';
import { SelectionContainer } from '@/components/selection/SelectionContainer';
import { SelectionProvider, useSelection } from '@/components/selection/SelectionProvider';
import { Breadcrumbs } from '@/layouts/Breadcrumbs';
import { useMergeObservations, useObservations } from '@/services/api/observations';
import { useHasPermission } from '@/services/permissions/hooks';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { FC, PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Observation } from './Observation';

export const Observations = () => {
  return (
    <SelectionProvider>
      <ObservationsContent />
    </SelectionProvider>
  );
};

const ObservationsContent = () => {
  const query = useObservations();
  const result = useSuspenseInfiniteQuery(query);
  const observations = result.data.pages.flatMap(page => page.data);

  const canMerge = useHasPermission('moderate');

  const { selection, clearSelection } = useSelection();
  const mergeObservations = useMergeObservations();

  const selectedIds = useMemo(() => selection.map(id => Number(id)).filter(id => !Number.isNaN(id)), [selection]);

  // Target is the oldest selected observation (smallest id); others are merged into it
  const { targetId, sourceIds } = useMemo(() => {
    if (selectedIds.length < 2) return { targetId: null as number | null, sourceIds: [] as number[] };
    const sorted = [...selectedIds].sort((a, b) => a - b);
    return { targetId: sorted[0], sourceIds: sorted.slice(1) };
  }, [selectedIds]);

  const handleMerge = async () => {
    if (targetId === null || sourceIds.length === 0) return;
    await mergeObservations.mutateAsync({ targetObservationId: targetId, sourceObservationIds: sourceIds });
    clearSelection();
  };

  return (
    <div className="flex flex-col gap-4 w-full mx-auto max-w-4xl">
      <Breadcrumbs>
        <p>home</p>
        <span>•</span>
        <p className="text-lg">observations</p>
      </Breadcrumbs>
      {observations.map(observation =>
        canMerge ? (
          <SelectionContainer key={observation.id} id={observation.id} clickContainer={false}>
            <Observation observation={observation} />
          </SelectionContainer>
        ) : (
          <Observation key={observation.id} observation={observation} />
        )
      )}
      {canMerge && (
        <SelectionActionBar className="justify-between">
          <SelectionCount singular="observation" />
          <div className="flex gap-2">
            <Button compact onClick={clearSelection}>
              clear
            </Button>
            <Button
              compact
              variant="alveus"
              disabled={selectedIds.length < 2}
              loading={mergeObservations.isPending}
              onClick={handleMerge}
            >
              {selectedIds.length >= 2 ? `merge ${sourceIds.length} into #${targetId}` : 'merge'}
            </Button>
          </div>
        </SelectionActionBar>
      )}
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
