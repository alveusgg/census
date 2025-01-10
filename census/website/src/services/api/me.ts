import { handleTRPCError } from '@/components/feedback/ErrorBoundary';
import { OnboardingFormSchema } from '@alveusgg/census-forms';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { key, useAPI } from '../query/hooks';

export const usePoints = () => {
  const api = useAPI();
  return useSuspenseQuery({
    queryKey: key('points'),
    queryFn: () => api.me.points.query(),
    refetchOnWindowFocus: true
  });
};

export const usePermissions = () => {
  const api = useAPI();
  return useSuspenseQuery({
    queryKey: key('permissions'),
    queryFn: () => api.me.permissions.query()
  });
};

export type Permissions = Awaited<ReturnType<typeof usePermissions>>['data'];

export const usePendingAchievements = () => {
  const api = useAPI();
  return useSuspenseQuery({
    queryKey: key('achievements', 'pending'),
    queryFn: () => api.me.achievements.pending.query(),
    refetchOnWindowFocus: true
  });
};

export const useAllAchievements = () => {
  const api = useAPI();
  return useSuspenseQuery({
    queryKey: key('achievements'),
    queryFn: () => api.me.achievements.all.query()
  });
};

export const useRedeemAchievement = () => {
  const api = useAPI();
  return useMutation({
    mutationFn: (id: number) => api.me.achievements.redeem.mutate(id)
  });
};

export const useRedeemAllAchievements = () => {
  const api = useAPI();
  return useMutation({
    mutationFn: () => api.me.achievements.redeemAll.mutate()
  });
};

interface Identifiable {
  id: number;
}

export const usePatchAchievement = () => {
  const queryClient = useQueryClient();
  return useCallback(
    (id: number) => {
      const existing: Identifiable[] | undefined = queryClient.getQueryData(key('achievements', 'pending'));
      if (!existing) return;
      queryClient.setQueryData(
        key('achievements', 'pending'),
        existing.filter(achievement => achievement.id !== id)
      );
    },
    [queryClient]
  );
};

export const useOnboardUser = () => {
  const api = useAPI();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: OnboardingFormSchema) => {
      try {
        const results = await api.me.onboard.mutate(data);
        await queryClient.invalidateQueries({ queryKey: key('permissions') });
        return results;
      } catch (error) {
        const custom = handleTRPCError(error);
        if (custom) {
          toast.error(custom.message);
        } else {
          toast.error('Failed to onboard user');
        }
        throw error;
      }
    }
  });
};
