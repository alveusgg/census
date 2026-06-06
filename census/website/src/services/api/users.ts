import { infiniteQueryOptions, queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { key, useAPI, useLiveQuery } from '../query/hooks';
import { RouterOutput, TypeFromOutput } from './helpers';

export const useUsers = () => {
  const api = useAPI();
  return queryOptions({
    queryKey: key('users'),
    queryFn: () => api.users.users.query()
  });
};

export const useUserProfile = (id: number) => {
  const api = useAPI();
  return queryOptions({
    queryKey: key('users', 'profile', id.toString()),
    queryFn: () => api.users.profile.query({ id })
  });
};

export type UserProfile = TypeFromOutput<RouterOutput['users']['profile']>;

export const useUserIdentifications = (id: number, size = 20) => {
  const api = useAPI();
  return infiniteQueryOptions({
    queryKey: key('users', 'identifications', id.toString(), size.toString()),
    queryFn: ({ pageParam }) => api.users.identifications.query({ id, meta: { page: pageParam, size } }),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (lastPage.meta.page * lastPage.meta.size >= lastPage.meta.total) return undefined;
      return lastPage.meta.page + 1;
    }
  });
};

export type UserIdentification = TypeFromOutput<RouterOutput['users']['identifications']>;

export const useRecentAchievements = () => {
  const api = useAPI();
  const snapshotQueryKey = key('achievements', 'recent');
  const callback = useLiveQuery(snapshotQueryKey);

  const result = useSuspenseQuery({
    queryKey: snapshotQueryKey,
    queryFn: async () => {
      return api.users.recentAchievements.query();
    }
  });

  // The matching server subscription is intentionally public; see docs/dev/api/sse-subscriptions.md.
  useEffect(() => {
    const subscription = api.users.live.recentAchievements.subscribe(undefined, callback);
    return () => subscription.unsubscribe();
  }, []);

  return result;
};

export type RecentAchievement = TypeFromOutput<RouterOutput['users']['recentAchievements']>;
