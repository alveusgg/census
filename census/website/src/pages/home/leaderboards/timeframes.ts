import { startOfDay, subDays } from 'date-fns';

export const leaderboardTimeframes = ['7d', '30d', 'season'] as const;

export type LeaderboardTimeframe = (typeof leaderboardTimeframes)[number];

export const defaultLeaderboardTimeframe: LeaderboardTimeframe = '7d';

export const leaderboardTimeframeLabels: Record<LeaderboardTimeframe, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  season: 'This season'
};

export const getLeaderboardFromDate = (timeframe: LeaderboardTimeframe) => {
  const today = startOfDay(new Date());

  switch (timeframe) {
    case '7d':
      return subDays(today, 6);
    case '30d':
      return subDays(today, 29);
    case 'season':
      return undefined;
  }
};
