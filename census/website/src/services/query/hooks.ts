import { useQueryClient } from '@tanstack/react-query';
import { useContext, useMemo } from 'react';
import { APIContext } from './APIProvider';

export const useAPI = () => {
  const client = useContext(APIContext);
  if (!client) throw new Error('API client not found');
  return client;
};

export const useLiveQuery = <T>(queryKey: string[]) => {
  const queryClient = useQueryClient();

  return useMemo(
    () => ({
      onData: (data: T) => {
        if (!data) return;
        queryClient.setQueryData(queryKey, data);
      },
      onError: (error: Error) => {
        console.error(error);
      },
      onComplete: () => {}
    }),
    [queryClient, queryKey]
  );
};

export const key = (...args: string[]) => ['api', ...args];
