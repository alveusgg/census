import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { key, useAPI } from '../query/hooks';

export const useUsers = () => {
  const api = useAPI();
  return useSuspenseQuery({
    queryKey: key('users'),
    queryFn: () => api.users.users.query()
  });
};

export const usePromoteUser = () => {
  const api = useAPI();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { userId: number; role: 'admin' | 'moderator' | 'researcher' | 'expert' }) =>
      api.users.promoteUser.mutate(input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: key('users') });
    }
  });
};
