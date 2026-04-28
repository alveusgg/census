import { RecentAchievement, useRecentAchievements } from "@/services/api/users";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "framer-motion";
import { FC } from "react";

const describe = (achievement: RecentAchievement): { emoji: string; message: React.ReactNode } => {
  const username = <span className="font-bold">{achievement.user.username}</span>;
  const target = achievement.identification?.nickname;

  switch (achievement.payload.type) {
    case "onboard":
      return { emoji: "🎉", message: <>{username} joined the census</> };
    case "identify":
      return {
        emoji: "🔬",
        message: target ? (
          <>
            {username} identified <span className="font-bold">{target}</span>
          </>
        ) : (
          <>{username} made an identification</>
        ),
      };
    case "shiny":
      return {
        emoji: "🌟",
        message: target ? (
          <>
            {username} found a shiny <span className="font-bold">{target}</span>
          </>
        ) : (
          <>{username} found a shiny</>
        ),
      };
    case "vote":
      return {
        emoji: "👍",
        message: target ? (
          <>
            {username} voted on <span className="font-bold">{target}</span>
          </>
        ) : (
          <>{username} voted on an identification</>
        ),
      };
    case "comment":
      return {
        emoji: "💬",
        message: target ? (
          <>
            {username} commented on <span className="font-bold">{target}</span>
          </>
        ) : (
          <>{username} commented on an identification</>
        ),
      };
    default:
      return { emoji: "✨", message: <>{username} earned an achievement</> };
  }
};

const MAX_ITEMS = 5;
const ITEM_HEIGHT = 36;
const GAP = 8;
const LIST_HEIGHT = MAX_ITEMS * ITEM_HEIGHT + (MAX_ITEMS - 1) * GAP;

export const ActivityFeed: FC = () => {
  const achievements = useRecentAchievements();

  return (
    <div className="relative flex h-full flex-col overflow-clip rounded-2xl border border-accent-200 bg-accent-50 px-5 pb-5 pt-6 text-accent-900 @container sm:px-6">
      <div className="flex items-center gap-4 pb-5">
        <div className="size-8 shrink-0 rounded-sm bg-accent-300/60 shadow-sm" />
        <h2 className="text-2xl font-bold text-accent-900">Recent activity</h2>
      </div>
      <ul className="flex list-none flex-col gap-3" style={{ height: LIST_HEIGHT + 20 }}>
        <AnimatePresence mode="popLayout" initial={false}>
          {achievements.data.map((achievement, index) => (
            <ActivityItem key={achievement.id.toString()} achievement={achievement} index={index} />
          ))}
        </AnimatePresence>
      </ul>
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-accent-50" />
    </div>
  );
};

interface ActivityItemProps {
  achievement: RecentAchievement;
  index: number;
}

const ActivityItem: FC<ActivityItemProps> = ({ achievement, index }) => {
  const { emoji, message } = describe(achievement);

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: -ITEM_HEIGHT }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        layout: {
          type: "spring",
          stiffness: 420,
          damping: 40,
          mass: 0.8,
          delay: 0.3 - index * 0.05,
        },
        delay: 0.4,
      }}
      style={{ height: ITEM_HEIGHT }}
      className="flex shrink-0 items-center gap-3 rounded-lg border border-accent-200 bg-accent-100 px-4 text-accent-900 shadow-sm"
    >
      <span className="shrink-0 text-lg leading-none" aria-hidden>
        {emoji}
      </span>
      <div className="min-w-0 flex-1 flex-col">
        <p className="truncate text-base leading-tight">{message}</p>
      </div>
      <div className="flex flex-col items-end justify-end">
        <span className="shrink-0 rounded-lg bg-leaderboard-500 px-3 py-1 font-mono text-base font-bold text-white shadow-sm">
          +{achievement.points}
        </span>
      </div>
    </motion.li>
  );
};

export const ActivityFeedSkeleton: FC = () => {
  return (
    <div className="relative flex h-full flex-col overflow-clip rounded-2xl border border-accent-200 bg-accent-50 px-5 pb-5 pt-6 text-accent-900 @container sm:px-6">
      <div className="flex items-center gap-4 pb-5">
        <div className="size-8 shrink-0 rounded-sm bg-accent-300/60 shadow-sm" />
        <h2 className="text-2xl font-bold text-accent-900">Recent activity</h2>
      </div>
      <ul className="flex list-none flex-col gap-3" style={{ height: LIST_HEIGHT + 20 }}>
        {Array.from({ length: MAX_ITEMS }).map((_, i) => (
          <li key={i} className="flex shrink-0 items-center gap-3 rounded-lg border border-accent-200 bg-accent-100 px-4 shadow-sm" style={{ height: ITEM_HEIGHT }}>
            <Skeleton className="size-5 shrink-0 rounded-sm" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-6 w-12 shrink-0 rounded-lg" />
          </li>
        ))}
      </ul>
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-accent-50" />
    </div>
  );
};
