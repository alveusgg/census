import { infiniteQueryOptions, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { key, useAPI } from '../query/hooks';
import { RouterOutput, TypeFromOutput } from './helpers';

export type Observation = TypeFromOutput<RouterOutput['observation']['list']>;
export type Identification = Observation['identifications'][number];
export type Feedback = Identification['feedback'][number];
export type ConfirmedObservation = Observation & {
  confirmedAs: number;
  confirmedIdentification: Identification;
};
type LocationBox = { x1: number; y1: number; x2: number; y2: number };

export const useUnconfirmedObservations = () => {
  const trpc = useAPI();
  return infiniteQueryOptions({
    queryKey: key('observations', 'unconfirmed'),
    queryFn: ({ pageParam }) =>
      trpc.observation.list.query({
        meta: { page: pageParam, size: 10 },
        query: { confirmed: false }
      }),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (lastPage.meta.page * lastPage.meta.size >= lastPage.meta.total) return undefined;
      return lastPage.meta.page + 1;
    }
  });
};

export const useUnconfirmedObservationCount = () => {
  const trpc = useAPI();
  return queryOptions({
    queryKey: key('observations', 'unconfirmed-count'),
    queryFn: () => trpc.observation.unconfirmedCount.query()
  });
};

export const useConfirmedObservations = (filter: {
  start?: Date;
  end?: Date;
  within?: LocationBox | LocationBox[];
}) => {
  const trpc = useAPI();
  return infiniteQueryOptions({
    queryKey: key('observations', 'confirmed', JSON.stringify(filter)),
    queryFn: async ({ pageParam }) => {
      const result = await trpc.observation.list.query({
        meta: { page: pageParam, size: 20 },
        query: { confirmed: true, ...filter }
      });
      return {
        ...result,
        data: result.data as ConfirmedObservation[]
      };
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (lastPage.meta.page * lastPage.meta.size >= lastPage.meta.total) return undefined;
      return lastPage.meta.page + 1;
    }
  });
};

export const useLocateObservation = () => {
  const trpc = useAPI();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, location }: { id: number; location: { x: number; y: number } }) =>
      await trpc.observation.locate.mutate({ id, location }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key('observations') });
    }
  });
};

export const useNotifyDiscordAboutObservation = () => {
  const trpc = useAPI();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (observationId: number) => {
      await trpc.observation.notifyDiscordAboutObservation.mutate({ observationId });
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: key('observations') });
    }
  });
};

export const useDeleteObservation = () => {
  const trpc = useAPI();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (observationId: number) => {
      return await trpc.observation.delete.mutate({ observationId });
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: key('observations') });
    }
  });
};

export const useMergeObservations = () => {
  const trpc = useAPI();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      targetObservationId,
      sourceObservationIds
    }: {
      targetObservationId: number;
      sourceObservationIds: number[];
    }) => {
      return await trpc.observation.merge.mutate({ targetObservationId, sourceObservationIds });
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: key('observations') });
    }
  });
};
