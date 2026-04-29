import { Button, Link } from '@/components/controls/button/juicy';
import SiChevronDown from '@/components/icons/SiChevronDown';
import SiTwitch from '@/components/icons/SiTwitch';
import { useModal } from '@/components/modal/useModal';
import { CreateFromClipModal } from '@/pages/captures/create/CreateFromClipModal';
import { useLeaderboard } from '@/services/api/me';
import { useHasPermission } from '@/services/permissions/hooks';
import { cn } from '@/utils/cn';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { FC, startTransition, Suspense, useState } from 'react';
import { ShiniesForSeason } from '../identifications/Shiny';
import { ActivityFeed, ActivityFeedSkeleton } from './ActivityFeed';
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

export const Home: FC = () => {
  const createFromClipModalProps = useModal();
  const leaderboardModalProps = useModal();
  const hasCapturePermission = useHasPermission('capture');
  const hasBeenOnboarded = useHasPermission('vote');
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>(defaultLeaderboardTimeframe);
  const leaderboard = useQuery({
    ...useLeaderboard(getLeaderboardFromDate(timeframe)),
    placeholderData: previous => previous
  });

  if (!leaderboard.data) return null;

  const showSubmitClipCta = hasBeenOnboarded && hasCapturePermission;
  const handleTimeframeChange = (next: LeaderboardTimeframe) => {
    startTransition(() => setTimeframe(next));
  };

  return (
    <>
      <CreateFromClipModal {...createFromClipModalProps} />
      <LeaderboardModal
        {...leaderboardModalProps}
        leaderboard={leaderboard.data.leaderboard}
        place={leaderboard.data.place}
        timeframe={timeframe}
        onTimeframeChange={handleTimeframeChange}
      />

      <div className="mx-auto grid w-full max-w-6xl grid-cols-8 gap-6">
        <div className="@container col-span-8 flex flex-col overflow-clip rounded-2xl border border-accent border-opacity-50 bg-accent-100 px-10 py-8 leading-snug text-accent-900">
          <p>Welcome to the</p>
          <h2 className="mb-1.5 text-5xl font-serif font-bold tracking-wide text-accent-900">
            alveus pollinator census
          </h2>
          <p className="max-w-3xl">
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
            <Link to="/forms/onboarding" variant="alveus" className="mt-4 w-fit px-4 text-center">
              <span>Sign up to help out!</span>
              <ChevronRight className="size-4" />
            </Link>
          )}
        </div>

        <div className="col-span-8 grid grid-cols-1 divide-y divide-accent-200/50 md:grid-cols-3 md:divide-x md:divide-y-0">
          <SeasonProgressTile />
          <IdentifyCrittersTile />
          <ExploreGardenTile />
        </div>

        <div className="@4xl:col-span-4 @container col-span-8 flex flex-col rounded-2xl border border-leaderboard-700 bg-leaderboard-500 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="size-7 shrink-0 rounded-sm bg-white/80 shadow-sm" />
              <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
            </div>
            <div className="ml-auto shrink-0">
              <LeaderboardTimeframeSelect value={timeframe} onValueChange={handleTimeframeChange} />
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-between gap-3 pt-4">
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
                  username={leaderboard.data.place.me.username}
                />
              </motion.span>
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
