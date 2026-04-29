import { InfiniteFeedSentinel } from '@/components/feed/InfiniteFeedSentinel';
import { Modal } from '@/components/modal/Modal';
import { ModalProps } from '@/components/modal/useModal';
import { useInfiniteLeaderboard } from '@/services/api/me';
import { cn } from '@/utils/cn';
import { useInfiniteQuery } from '@tanstack/react-query';
import { DialogTitle } from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { FC, useMemo } from 'react';
import { LeaderboardTimeframeSelect } from './LeaderboardTimeframeSelect';
import { LeaderboardPodium } from './LeaderboardPodium';
import { LeaderboardRow } from './LeaderboardRow';
import { LeaderboardTimeframe, getLeaderboardFromDate } from './timeframes';

interface LeaderboardModalProps extends ModalProps {
  leaderboard: { id: number; username: string; points: number }[];
  place: { place: number; me?: { id: number; username: string; points: number } };
  timeframe: LeaderboardTimeframe;
  onTimeframeChange: (timeframe: LeaderboardTimeframe) => void;
}

const PAGE_SIZE = 20;
const PODIUM_COUNT = 3;

export const LeaderboardModal: FC<LeaderboardModalProps> = ({
  leaderboard,
  place,
  timeframe,
  onTimeframeChange,
  ...props
}) => {
  const query = useInfiniteQuery({
    ...useInfiniteLeaderboard({
      from: getLeaderboardFromDate(timeframe),
      offset: PODIUM_COUNT,
      size: PAGE_SIZE
    }),
    enabled: props.isOpen
  });

  const totalRanks = query.data?.pages[0]?.meta.total ?? leaderboard.length;
  const rows = useMemo(() => {
    const meId = place.me?.id;
    return (query.data?.pages.flatMap(page => page.data) ?? []).filter(entry => entry.id !== meId);
  }, [place.me?.id, query.data?.pages]);

  return (
    <Modal
      {...props}
      className="w-[calc(100vw-2rem)] max-w-5xl gap-0 overflow-hidden rounded-3xl border border-leaderboard-700 bg-leaderboard-500 p-0 text-white sm:w-full"
    >
      <DialogTitle className="sr-only">Leaderboard</DialogTitle>

      <div className="flex max-h-[min(90vh,52rem)] min-h-[32rem] flex-col overflow-hidden">
        <div className="flex items-start gap-3 border-b border-white/10 px-5 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="size-7 shrink-0 rounded-sm bg-white/80 shadow-sm" />
            <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <LeaderboardTimeframeSelect value={timeframe} onValueChange={onTimeframeChange} />
            <button
              type="button"
              onClick={props.close}
              className="rounded-lg border border-transparent p-2 text-white/90 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white"
              aria-label="Close leaderboard"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="border-b border-white/10 px-5 pb-5 pt-4 sm:px-6">
          <LeaderboardPodium leaderboard={leaderboard} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-4">
            {rows.map(entry => (
              <LeaderboardRow key={entry.id} place={entry.place} points={entry.points} username={entry.username} />
            ))}

            {!rows.length && !query.isLoading && !query.isFetchingNextPage && (
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white/80">
                {totalRanks <= PODIUM_COUNT
                  ? 'No leaderboard rows below the podium yet.'
                  : 'No additional leaderboard rows to show.'}
              </div>
            )}

            <InfiniteFeedSentinel
              className={cn('flex min-h-10 items-center justify-center text-sm text-white/80', {
                hidden: !query.hasNextPage && !query.isFetchingNextPage
              })}
              fetchNextPage={() => query.fetchNextPage()}
              hasNextPage={query.hasNextPage}
              isFetchingNextPage={query.isFetchingNextPage}
              threshold={0.8}
            >
              Loading more...
            </InfiniteFeedSentinel>
          </div>
        </div>

        {place.me && (
          <div className="border-t border-white/10 bg-leaderboard-500/95 px-5 py-4 backdrop-blur sm:px-6">
            <LeaderboardRow place={place.place} points={place.me.points} username={place.me.username} />
          </div>
        )}
      </div>
    </Modal>
  );
};
