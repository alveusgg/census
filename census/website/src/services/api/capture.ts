import type { ObservationPayload } from '@alveusgg/census-api/src/services/observations/observations';
import { infiniteQueryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { key, useAPI, useLiveQuery } from '../query/hooks';

export const useCapture = (id: number) => {
  const trpc = useAPI();
  const snapshotQueryKey = key('capture', id.toString());
  const callback = useLiveQuery(snapshotQueryKey);

  const result = useSuspenseQuery({
    queryKey: snapshotQueryKey,
    queryFn: () => {
      return trpc.capture.capture.query({ id });
    }
  });

  useEffect(() => {
    if (result.data.status === 'complete') return;
    const subscription = trpc.capture.live.capture.subscribe({ id }, callback);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return result;
};

export const useCaptures = () => {
  const trpc = useAPI();
  return infiniteQueryOptions({
    queryKey: key('captures'),
    queryFn: ({ pageParam }) => trpc.capture.captures.query({ meta: { page: pageParam, size: 30 } }),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (lastPage.meta.page * lastPage.meta.size >= lastPage.meta.total) return undefined;
      return lastPage.meta.page + 1;
    }
  });
};

interface CreateCaptureFromClipInput {
  id: string;
  userIsVerySureItIsNeeded?: boolean;
}

export const useCreateCaptureFromClip = () => {
  const trpc = useAPI();
  return useMutation({
    mutationFn: ({ id, userIsVerySureItIsNeeded }: CreateCaptureFromClipInput) => {
      return trpc.capture.createFromClip.mutate({ id, userIsVerySureItIsNeeded });
    }
  });
};

interface CreateObservationsFromCaptureInput {
  captureId: number;
  observations: ObservationPayload[];
}

export const useCreateObservationsFromCapture = () => {
  const trpc = useAPI();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ captureId, observations }: CreateObservationsFromCaptureInput) => {
      const result = await trpc.observation.createObservationsFromCapture.mutate({
        captureId,
        observations
      });
      await client.invalidateQueries({ queryKey: key('capture', captureId.toString()) });
      return result;
    }
  });
};
