import { useSuspenseQuery } from '@tanstack/react-query';
import { key, useAPI } from '../query/hooks';
import { RouterOutput, TypeFromOutput } from './helpers';

export const useCurrentSeason = () => {
  const trpc = useAPI();
  return useSuspenseQuery({
    queryKey: key('seasons', 'current'),
    queryFn: () => trpc.seasons.current.query()
  });
};

export type Shiny = TypeFromOutput<RouterOutput['seasons']['shinies']>;

export const useShiniesForSeason = (seasonId: number) => {
  const trpc = useAPI();
  return useSuspenseQuery({
    queryKey: key('seasons', 'shinies', seasonId.toString()),
    queryFn: () => trpc.seasons.shinies.query({ seasonId })
  });
};
