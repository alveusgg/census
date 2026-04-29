import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { leaderboardTimeframeLabels, leaderboardTimeframes, type LeaderboardTimeframe } from './timeframes';

interface LeaderboardTimeframeSelectProps {
  value: LeaderboardTimeframe;
  onValueChange: (value: LeaderboardTimeframe) => void;
}

export const LeaderboardTimeframeSelect = ({ value, onValueChange }: LeaderboardTimeframeSelectProps) => (
  <Select value={value} onValueChange={next => onValueChange(next as LeaderboardTimeframe)}>
    <SelectTrigger className="h-9 w-fit min-w-0 gap-2 border-white/15 bg-white/10 px-3 text-base text-white hover:bg-white/15 focus:ring-white/20 data-[placeholder]:text-white/80 [&>span]:pr-1">
      <SelectValue>{leaderboardTimeframeLabels[value]}</SelectValue>
    </SelectTrigger>
    <SelectContent className="border-leaderboard-300/40 bg-leaderboard-600 text-white">
      {leaderboardTimeframes.map(timeframe => (
        <SelectItem
          key={timeframe}
          value={timeframe}
          className="focus:bg-white/10 focus:text-white data-[state=checked]:bg-white/10 data-[state=checked]:text-white"
        >
          {leaderboardTimeframeLabels[timeframe]}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
