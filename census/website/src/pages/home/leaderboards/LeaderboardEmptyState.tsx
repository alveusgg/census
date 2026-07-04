import SiLeaderboard from '@/components/icons/SiLeaderboard';
import { cn } from '@/utils/cn';
import { FC } from 'react';

interface LeaderboardEmptyStateProps {
  className?: string;
  title?: string;
  description?: string;
}

export const LeaderboardEmptyState: FC<LeaderboardEmptyStateProps> = ({
  className,
  title = 'No leaderboard entries yet',
  description = 'Verified identifications will appear here once the points start rolling in.'
}) => {
  return (
    <div
      className={cn(
        'flex min-h-40 flex-col items-center justify-center rounded-xl border border-white/10 bg-leaderboard-600/45 px-5 py-6 text-center text-white shadow-inner dark:border-accent-300 dark:bg-accent-200 dark:text-accent-900',
        className
      )}
    >
      <div className="mb-3 flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-3xl text-white/90 dark:border-accent-300 dark:bg-accent-100 dark:text-accent-900">
        <SiLeaderboard />
      </div>
      <p className="text-base font-bold">{title}</p>
      <p className="mt-1 max-w-xs text-sm leading-snug text-white/75 dark:text-accent-800">{description}</p>
    </div>
  );
};
