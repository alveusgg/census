import { queryOptions } from '@tanstack/react-query';
import { key, useAPI } from '../query/hooks';
import { RouterOutput, TypeFromOutput } from './helpers';

export const useUsers = () => {
  const api = useAPI();
  return queryOptions({
    queryKey: key('users'),
    queryFn: () => api.users.users.query()
  });
};

export const useRecentAchievements = () => {
  const api = useAPI();
  return queryOptions({
    queryKey: key('achievements', 'recent'),
    queryFn: () => api.users.recentAchievements.query(),
    refetchInterval: 120_000,
    refetchOnWindowFocus: true
  });
};

export type RecentAchievement = TypeFromOutput<RouterOutput['users']['recentAchievements']>;
