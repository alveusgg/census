import { Button } from '@/components/controls/button/paper';
import { InfiniteFeedSentinel } from '@/components/feed/InfiniteFeedSentinel';
import { SelectionActionBar, SelectionCount } from '@/components/selection/SelectionActionBar';
import { SelectionContainer } from '@/components/selection/SelectionContainer';
import { SelectionProvider, useSelection } from '@/components/selection/SelectionProvider';
import { Breadcrumbs } from '@/layouts/Breadcrumbs';
import { useMergeObservations, useUnconfirmedObservations } from '@/services/api/observations';
import { useHasPermission } from '@/services/permissions/hooks';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Observation } from './Observation';

export const Observations = () => {
  return (
    <SelectionProvider>
      <ObservationsContent />
    </SelectionProvider>
  );
};

const ObservationsContent = () => {
  const query = useUnconfirmedObservations();
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
      <InfiniteFeedSentinel
        className="flex min-h-10 items-center justify-center text-sm text-accent-800"
        fetchNextPage={() => result.fetchNextPage()}
        hasNextPage={result.hasNextPage}
        isFetchingNextPage={result.isFetchingNextPage}
        threshold={0.8}
      >
        Loading...
      </InfiniteFeedSentinel>
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
