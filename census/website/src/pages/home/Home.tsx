import SiChevronDown from '@/components/icons/SiChevronDown';
import { useModal } from '@/components/modal/useModal';
import { Breadcrumbs } from '@/layouts/Breadcrumbs';
import { useLeaderboard } from '@/services/api/me';
import { cn } from '@/utils/cn';
import { useSuspenseQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FC, startTransition, Suspense, useState } from 'react';
import { ShiniesForSeason } from '../identifications/Shiny';
import { ActivityFeed, ActivityFeedSkeleton } from './ActivityFeed';
import { LeaderboardEmptyState } from './leaderboards/LeaderboardEmptyState';
import { LeaderboardModal } from './leaderboards/LeaderboardModal';
import { LeaderboardPodium } from './leaderboards/LeaderboardPodium';
import { LeaderboardRow } from './leaderboards/LeaderboardRow';
import { LeaderboardTimeframeSelect } from './leaderboards/LeaderboardTimeframeSelect';
import {
  defaultLeaderboardTimeframe,
  getLeaderboardFromDate,
  type LeaderboardTimeframe
} from './leaderboards/timeframes';
import { ExploreGardenTile, IdentifyCrittersTile, SeasonProgressTile } from './tiles';
import { SeasonWrapped } from '../wrapped/SeasonWrapped';

export const Home: FC = () => {
  return (
    <>
      <Breadcrumbs>
        <p className="text-lg">home</p>
      </Breadcrumbs>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-8 gap-6">
        <SeasonWrapped />

        <div className="col-span-8 grid grid-cols-1 divide-y divide-accent-200/50 md:grid-cols-3 md:divide-x md:divide-y-0">
          <SeasonProgressTile />
          <IdentifyCrittersTile />
          <ExploreGardenTile />
        </div>

        <Suspense fallback={<LeaderboardCardSkeleton />}>
          <LeaderboardCard />
        </Suspense>

        <div className="@4xl:col-span-4 col-span-8 h-full">
          <Suspense fallback={<ActivityFeedSkeleton />}>
            <ActivityFeed />
          </Suspense>
        </div>

        <div className="col-span-8">
          <ShiniesForSeason />
        </div>
      </div>
    </>
  );
};

const LeaderboardCard: FC = () => {
  const leaderboardModalProps = useModal();
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>(defaultLeaderboardTimeframe);
  const leaderboard = useSuspenseQuery(useLeaderboard(getLeaderboardFromDate(timeframe)));

  const hasLeaderboardEntries = leaderboard.data.leaderboard.length > 0;
  const handleTimeframeChange = (next: LeaderboardTimeframe) => {
    startTransition(() => setTimeframe(next));
  };

  return (
    <>
      <LeaderboardModal
        {...leaderboardModalProps}
        leaderboard={leaderboard.data.leaderboard}
        place={leaderboard.data.place}
        timeframe={timeframe}
        onTimeframeChange={handleTimeframeChange}
      />

      <div className="@4xl:col-span-4 @container col-span-8 flex flex-col rounded-2xl border border-leaderboard-700 bg-leaderboard-500 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
          </div>
          <div className="ml-auto shrink-0">
            <LeaderboardTimeframeSelect value={timeframe} onValueChange={handleTimeframeChange} />
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between gap-3 pt-4">
          {hasLeaderboardEntries ? (
            <>
              <LeaderboardPodium leaderboard={leaderboard.data.leaderboard} />

              <div className="flex items-center justify-center gap-1.5 py-0.5">
                <span className="size-1.5 rounded-full bg-leaderboard-700/50" />
                <span className="size-1.5 rounded-full bg-leaderboard-700/30" />
                <span className="size-1.5 rounded-full bg-leaderboard-700/30" />
              </div>

              {leaderboard.data.place.me && (
                <motion.span className="flex flex-col items-center">
                  <LeaderboardRow
                    place={leaderboard.data.place.place}
                    points={leaderboard.data.place.me.points}
                    userId={leaderboard.data.place.me.id}
                    username={leaderboard.data.place.me.username}
                  />
                </motion.span>
              )}
            </>
          ) : (
            <LeaderboardEmptyState className="my-1" />
          )}

          <motion.button
            type="button"
            onClick={() => leaderboardModalProps.open()}
            className="mx-auto flex items-center rounded-lg border border-transparent px-3 py-1 text-base text-white transition-colors duration-300 hover:border-white/10 hover:bg-white/5"
          >
            <SiChevronDown className={cn('-ml-1.5 text-xl transition-transform duration-300')} />
            <span>see all</span>
          </motion.button>
        </div>
      </div>
    </>
  );
};

const LeaderboardCardSkeleton: FC = () => (
  <div className="@4xl:col-span-4 @container col-span-8 flex min-h-80 flex-col rounded-2xl border border-leaderboard-700 bg-leaderboard-500 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
    <div className="flex items-center gap-3">
      <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
      <div className="ml-auto h-9 w-28 rounded-md bg-white/15" />
    </div>

    <div className="flex flex-1 flex-col justify-between gap-4 pt-4">
      <div className="grid flex-1 grid-cols-3 items-end gap-3">
        <div className="h-28 rounded-lg border border-leaderboard-700 bg-leaderboard-600/60" />
        <div className="h-40 rounded-lg border border-leaderboard-700 bg-leaderboard-600/80" />
        <div className="h-24 rounded-lg border border-leaderboard-700 bg-leaderboard-600/60" />
      </div>

      <div className="flex items-center justify-center gap-1.5 py-0.5">
        <span className="size-1.5 rounded-full bg-leaderboard-700/50" />
        <span className="size-1.5 rounded-full bg-leaderboard-700/30" />
        <span className="size-1.5 rounded-full bg-leaderboard-700/30" />
      </div>

      <div className="h-11 rounded-lg border border-leaderboard-700 bg-leaderboard-600/70" />

      <div className="mx-auto h-8 w-24 rounded-lg bg-white/10" />
    </div>
  </div>
);
