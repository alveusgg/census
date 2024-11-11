import { useMutation, useQueryClient } from '@tanstack/react-query';
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
