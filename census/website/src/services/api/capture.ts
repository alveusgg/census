import type { ObservationPayload } from '@alveusgg/census-api/src/services/observations/observations';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { key, useAPI, useLiveQuery } from '../query/hooks';

export const useCapture = (id: number) => {
  const snapshotQueryKey = useMemo(() => key('capture', id.toString()), [id]);
  const trpc = useAPI();
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

export const useClipDetails = (id: string) => {
  const trpc = useAPI();
  return useSuspenseQuery({
    queryKey: key('twitch', 'clip', id),
    queryFn: () => trpc.twitch.clip.query({ id })
  });
};

export const useVODInfo = (id: string) => {
  const trpc = useAPI();
  return useSuspenseQuery({
    queryKey: key('twitch', 'vod', id),
    queryFn: () => trpc.twitch.vod.query({ id })
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ captureId, observations }: CreateObservationsFromCaptureInput) => {
      const result = await trpc.observation.createObservationsFromCapture.mutate({
        captureId,
        observations
      });
      await queryClient.invalidateQueries({ queryKey: key('capture', captureId.toString()) });
      return result;
    }
  });
};

export const useAddPoints = () => {
  const trpc = useAPI();
  return useMutation({
    mutationFn: (points: number) => trpc.capture.addPoints.mutate({ points })
  });
};
