import { useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { key, useAPI, useLiveQuery } from '../query/hooks';

export const useCapture = (id: number) => {
  const snapshotQueryKey = useMemo(() => key('capture', id.toString()), [id]);
  const trpc = useAPI();
  const callback = useLiveQuery(snapshotQueryKey);

  const result = useSuspenseQuery({
    queryKey: snapshotQueryKey,
    queryFn: () => {
      return trpc.capture.capture.query({ id });
    }
  });

  useEffect(() => {
    if (result.data.status === 'complete') return;
    const subscription = trpc.capture.live.capture.subscribe({ id }, callback);
    return () => subscription.unsubscribe();
  }, []);

  return result;
};
