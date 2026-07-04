import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { leaderboardTimeframeLabels, leaderboardTimeframes, type LeaderboardTimeframe } from './timeframes';

interface LeaderboardTimeframeSelectProps {
  value: LeaderboardTimeframe;
  onValueChange: (value: LeaderboardTimeframe) => void;
}

export const LeaderboardTimeframeSelect = ({ value, onValueChange }: LeaderboardTimeframeSelectProps) => (
  <Select value={value} onValueChange={next => onValueChange(next as LeaderboardTimeframe)}>
    <SelectTrigger className="h-9 w-fit min-w-0 gap-2 border-white/15 bg-white/10 px-3 text-base text-white hover:bg-white/15 focus:ring-white/20 data-[placeholder]:text-white/80 dark:border-accent-300 dark:bg-accent-200 dark:text-accent-900 dark:hover:bg-accent-300/40 dark:focus:ring-accent-400/30 dark:data-[placeholder]:text-accent-800 [&>span]:pr-1">
      <SelectValue>{leaderboardTimeframeLabels[value]}</SelectValue>
    </SelectTrigger>
    <SelectContent className="z-[2003] border-leaderboard-300/40 bg-leaderboard-600 text-white dark:border-accent-300 dark:bg-accent-100 dark:text-accent-900">
      {leaderboardTimeframes.map(timeframe => (
        <SelectItem
          key={timeframe}
          value={timeframe}
          className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-white/10 data-[state=checked]:text-white dark:focus:bg-accent-200 dark:focus:text-accent-900 dark:data-[state=checked]:bg-accent-200 dark:data-[state=checked]:text-accent-900"
        >
          {leaderboardTimeframeLabels[timeframe]}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
