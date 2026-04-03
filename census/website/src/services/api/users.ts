import { queryOptions } from '@tanstack/react-query';
import { key, useAPI } from '../query/hooks';

export const useUsers = () => {
  const api = useAPI();
  return queryOptions({
    queryKey: key('users'),
    queryFn: () => api.users.users.query()
  });
};
