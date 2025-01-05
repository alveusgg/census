import { useMutation, useQueryClient, useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { key, useAPI } from '../query/hooks';

export const useObservations = () => {
  const trpc = useAPI();
  return useSuspenseInfiniteQuery({
    queryKey: key('observations'),
    queryFn: ({ pageParam }) => trpc.observation.list.query({ meta: { page: pageParam, size: 30 } }),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (lastPage.meta.page * lastPage.meta.size >= lastPage.meta.total) return undefined;
      return lastPage.meta.page + 1;
    }
  });
};

export const useNotifyDiscordAboutObservation = () => {
  const trpc = useAPI();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (observationId: number) => {
      await trpc.observation.notifyDiscordAboutObservation.mutate({ observationId });
      await client.invalidateQueries({ queryKey: key('observations') });
    }
  });
};
