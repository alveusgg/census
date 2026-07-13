import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  useMutation,
  useQueryClient
} from '@tanstack/react-query';
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
export type ObservationDeletionReason = 'no_valid_subject' | 'too_poor_quality';

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
    placeholderData: keepPreviousData,
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
      queryClient.invalidateQueries({ queryKey: key('identifications') });
      queryClient.invalidateQueries({ queryKey: key('identification') });
    }
  });
};

export const useConfirmObservationWithoutAccessoryIdentification = () => {
  const trpc = useAPI();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (observationId: number) => {
      return await trpc.observation.confirmWithoutAccessoryIdentification.mutate({ observationId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key('observations') });
      queryClient.invalidateQueries({ queryKey: key('observations', 'unconfirmed-count') });
      queryClient.invalidateQueries({ queryKey: key('identifications') });
    }
  });
};



export const useDeleteObservation = () => {
  const trpc = useAPI();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ observationId, reason }: { observationId: number; reason: ObservationDeletionReason }) => {
      return await trpc.observation.delete.mutate({ observationId, reason });
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: key('observations') });
      client.invalidateQueries({ queryKey: key('identifications') });
      client.invalidateQueries({ queryKey: key('identification') });
      client.invalidateQueries({ queryKey: key('captures') });
      client.invalidateQueries({ queryKey: key('users') });
      client.invalidateQueries({ queryKey: key('points') });
      client.invalidateQueries({ queryKey: key('achievements') });
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
      client.invalidateQueries({ queryKey: key('identifications') });
      client.invalidateQueries({ queryKey: key('identification') });
      client.invalidateQueries({ queryKey: key('captures') });
      client.invalidateQueries({ queryKey: key('users') });
      client.invalidateQueries({ queryKey: key('points') });
      client.invalidateQueries({ queryKey: key('achievements') });
    }
  });
};
