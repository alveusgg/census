import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { key, useAPI } from '../query/hooks';

export const useSuggestIdentification = () => {
  const trpc = useAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ observationId, iNatId }: { observationId: number; iNatId: number }) => {
      const results = await trpc.identification.suggest.mutate({ observationId, iNatId });
      await queryClient.invalidateQueries({ queryKey: key('observations') });
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
      return results;
    }
  });
};

export const useIdentificationsGroupedBySource = () => {
  const trpc = useAPI();
  return useSuspenseQuery({
    queryKey: key('identifications', 'groupedBySource'),
    queryFn: () => trpc.identification.identificationsGroupedBySource.query()
  });
};

export const useImagesForObservationId = (observationId: number) => {
  const trpc = useAPI();
  return useSuspenseQuery({
    queryKey: key('images', observationId.toString()),
    queryFn: () => trpc.identification.images.query({ observationId })
  });
};

export const useIdentification = (identificationId: number) => {
  const trpc = useAPI();
  return useSuspenseQuery({
    queryKey: key('identification', identificationId.toString()),
    queryFn: () => trpc.identification.get.query({ id: identificationId })
  });
};

export const useConfirmIdentification = () => {
  const trpc = useAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, comment }: { id: number; comment: string }) =>
      await trpc.identification.confirm.mutate({ id, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key('observations') });
    }
  });
};
