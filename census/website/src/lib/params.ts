import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useSearchState = (key: string, initial?: string) => {
  const [params, setParams] = useSearchParams();
  const hasInitialised = useRef(false);

  useEffect(() => {
    if (initial && params.get(key) !== initial && !hasInitialised.current) {
      hasInitialised.current = true;
      const params = new URLSearchParams(window.location.search);
      params.set(key, initial);
      setParams(params);
    }
  }, [initial, params, key, setParams]);

  const setSearch = useCallback(
    (input?: string) => {
      const params = new URLSearchParams(window.location.search);
      if (!input) {
        params.delete(key);
      } else {
        params.set(key, input);
      }
      setParams(params);
    },
    [key, setParams]
  );

  const search = params.get(key) as string | undefined;
  return [search, setSearch] as const;
};
