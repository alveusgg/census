import { Backstage, ProviderConfiguration } from '@alveusgg/backstage';
import { useSuspenseQuery } from '@tanstack/react-query';
import { FC, PropsWithChildren } from 'react';
import { config, url } from './local';

const getFlagsFromSearchParams = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const flags: Record<string, true> = {};
  searchParams.forEach((_, key) => {
    flags[key] = true;
  });
  return flags;
};

export const BackstageProvider: FC<PropsWithChildren> = ({ children }) => {
  const providers = useSuspenseQuery<ProviderConfiguration[]>({
    queryKey: ['backstage-providers'],
    queryFn: async () => {
      const providers: ProviderConfiguration[] = [];
      if (import.meta.env.DEV) {
        providers.push({
          priority: 1,
          config
        });

        if (url) {
          const response = await fetch(url);
          const remote = await response.json();
          providers.push({
            priority: 0,
            config: remote
          });
        }
      }

      providers.push({
        priority: 2,
        config: {
          variables: {},
          flags: getFlagsFromSearchParams()
        }
      });

      if (import.meta.env.PROD) {
        const response = await fetch('/backstage.json');
        const remote = await response.json();
        providers.push({
          priority: 0,
          config: remote
        });
      }

      return providers;
    }
  });

  if (!providers.data) throw new Error('No providers');
  return <Backstage providers={providers.data}>{children}</Backstage>;
};
