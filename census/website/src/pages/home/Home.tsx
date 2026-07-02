import { Button } from '@/components/controls/button/juicy';
import SiChevronDown from '@/components/icons/SiChevronDown';
import SiTwitch from '@/components/icons/SiTwitch';
import { useModal } from '@/components/modal/useModal';
import { Breadcrumbs } from '@/layouts/Breadcrumbs';
import { CreateFromClipModal } from '@/pages/captures/create/CreateFromClipModal';
import { useLeaderboard } from '@/services/api/me';
import { useHasPermission } from '@/services/permissions/hooks';
import { cn } from '@/utils/cn';
import { useSuspenseQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronRight, RocketIcon } from 'lucide-react';
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

import mural from '@/assets/anthill.outlined.png';
import bg from '@/assets/bg.png';
import { Link } from 'react-router-dom';

export const Home: FC = () => {
  const createFromClipModalProps = useModal();
  const hasCapturePermission = useHasPermission('capture');
  const hasBeenOnboarded = useHasPermission('vote');
  const showSubmitClipCta = hasBeenOnboarded && hasCapturePermission;

  return (
    <>
      <CreateFromClipModal {...createFromClipModalProps} />
      <Breadcrumbs>
        <p className="text-lg">home</p>
      </Breadcrumbs>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-8 gap-6">
        <Link
          to="/posts/launch-day"
          className="col-span-8 border border-accent border-opacity-50 bg-accent-100 hover:bg-accent-200 transition-colors w-full p-4 rounded-2xl text-lg font-semibold flex justify-between items-center"
        >
          <div className="flex items-center gap-2">
            <RocketIcon className="size-6" />
            <p>The first 24 hours & a rebalancing update!</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-base">Read the post</p>
            <ChevronRight className="size-6" />
          </div>
        </Link>
        <div className="@container relative col-span-8 grid overflow-clip rounded-2xl border border-accent border-opacity-50 bg-accent-100 px-6 py-8 leading-snug text-accent-900 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,28rem)] lg:items-center lg:gap-8">
          <img src={bg} alt="Background" className="absolute inset-y-0 right-0 h-full" />
          <div className="relative z-10 min-w-0">
            <p>Welcome to the</p>
            <h2 className="mb-1.5 text-4xl font-serif font-bold tracking-wide text-accent-900 sm:text-5xl">
              alveus pollinator census
            </h2>
            <p>
              {showSubmitClipCta
                ? 'This is a community-driven project to identify and document all the pollinators found in the garden. Ready to help spot something new? Submit a Twitch clip from the pollinator garden and turn it into a new capture for the community to review.'
                : "This is a community-driven project to identify and document all the pollinators found in the garden. Have a look around and see what's been identified already! If you'd like to contribute, you can sign up below by completing a quick questionnaire."}
            </p>
            {showSubmitClipCta ? (
              <Button
                variant="alveus"
                className="mt-4 w-fit px-4 text-center"
                onClick={() => createFromClipModalProps.open()}
              >
                <SiTwitch className="text-xl" />
                <span>submit new clip</span>
              </Button>
            ) : (
              <Link to="/forms/onboarding" className="mt-4 flex w-fit items-center gap-1 px-4 text-center">
                <span>Sign up to help out!</span>
                <ChevronRight className="size-4" />
              </Link>
            )}
          </div>
          <div className="relative z-10 hidden h-full min-h-48 items-center justify-center lg:flex">
            <img src={mural} alt="Mural" className="max-h-60 w-full max-w-sm rotate-3 object-contain drop-shadow-lg" />
          </div>
        </div>

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
