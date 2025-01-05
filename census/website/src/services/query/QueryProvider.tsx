import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, FC, PropsWithChildren, useMemo } from 'react';

export const QueryContext = createContext<QueryClient | null>(null);

export const QueryProvider: FC<PropsWithChildren> = ({ children }) => {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: true,
            retry: 1
          }
        }
      }),
    []
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
