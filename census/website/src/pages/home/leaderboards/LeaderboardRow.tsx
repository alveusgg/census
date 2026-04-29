import { cn } from '@/utils/cn';
import { ComponentProps, FC } from 'react';

interface LeaderboardRowProps extends ComponentProps<'div'> {
  place: number;
  points: number;
  username: string;
}

export const LeaderboardRow: FC<LeaderboardRowProps> = ({ place, points, username, className, ...props }) => {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-lg border border-leaderboard-700 bg-leaderboard-600 px-4 py-2.5 text-base text-white shadow-inner',
        className
      )}
      {...props}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="font-mono text-lg font-bold">{place}</span>
        <span className="truncate" title={username}>
          {username}
        </span>
      </span>
      <span className="shrink-0 font-mono text-xl font-bold">{points}</span>
    </div>
  );
};
