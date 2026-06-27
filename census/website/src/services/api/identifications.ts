import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { key, useAPI } from '../query/hooks';

export type ConfirmationAnnotationPayload = {
  box: {
    height: number;
    width: number;
    x: number;
    y: number;
  };
  comment?: string;
  imageId: string;
  imageIndex: number;
  shape: string;
};

export const useSuggestIdentification = () => {
  const trpc = useAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ observationId, iNatId }: { observationId: number; iNatId: number }) => {
      const results = await trpc.identification.suggest.mutate({ observationId, iNatId });
      await queryClient.invalidateQueries({ queryKey: key('observations') });
      await queryClient.invalidateQueries({ queryKey: key('identifications') });
      await queryClient.invalidateQueries({ queryKey: key('users') });
      return results;
    }
  });
};

export const useSuggestAccessoryIdentification = () => {
  const trpc = useAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ observationId, iNatId }: { observationId: number; iNatId: number }) => {
      const results = await trpc.identification.suggestAccessory.mutate({ observationId, iNatId });
      await queryClient.invalidateQueries({ queryKey: key('observations') });
      await queryClient.invalidateQueries({ queryKey: key('identifications') });
      await queryClient.invalidateQueries({ queryKey: key('users') });
      return results;
    }
  });
};

export const useAddFeedbackToIdentification = () => {
  const trpc = useAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, type, comment }: { id: number; type: 'agree' | 'disagree'; comment?: string }) => {
      const results = await trpc.identification.feedback.mutate({ id, type, comment });
      await queryClient.invalidateQueries({ queryKey: key('observations') });
      await queryClient.invalidateQueries({ queryKey: key('identifications') });
      await queryClient.invalidateQueries({ queryKey: key('identification', id.toString()) });
      await queryClient.invalidateQueries({ queryKey: key('users') });
      await queryClient.invalidateQueries({ queryKey: key('points') });
      return results;
    }
  });
};

export const useRemoveIdentification = () => {
  const trpc = useAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return await trpc.identification.remove.mutate({ id });
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: key('observations') });
      queryClient.invalidateQueries({ queryKey: key('identifications') });
      queryClient.invalidateQueries({ queryKey: key('identification') });
      queryClient.invalidateQueries({ queryKey: key('identification', id.toString()) });
      queryClient.invalidateQueries({ queryKey: key('users') });
      queryClient.invalidateQueries({ queryKey: key('points') });
    }
  });
};

export const useIdentificationsGroupedBySource = (filterQuery = '') => {
  const trpc = useAPI();
  return queryOptions({
    queryKey: key('identifications', 'groupedBySource', filterQuery),
    queryFn: () => trpc.identification.identificationsGroupedBySource.query()
  });
};

export const useImagesForObservationId = (observationId: number) => {
  const trpc = useAPI();
  return queryOptions({
    queryKey: key('images', observationId.toString()),
    queryFn: () => trpc.identification.images.query({ observationId })
  });
};

export const useIdentification = (identificationId: number) => {
  const trpc = useAPI();
  return queryOptions({
    queryKey: key('identification', identificationId.toString()),
    queryFn: () => trpc.identification.get.query({ id: identificationId })
  });
};

export const useConfirmIdentification = () => {
  const trpc = useAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      comment,
      annotations = []
    }: {
      id: number;
      comment: string;
      annotations?: ConfirmationAnnotationPayload[];
    }) => await trpc.identification.confirm.mutate({ id, comment, annotations }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key('observations') });
      queryClient.invalidateQueries({ queryKey: key('identifications') });
      queryClient.invalidateQueries({ queryKey: key('identification') });
      queryClient.invalidateQueries({ queryKey: key('users') });
    }
  });
};
