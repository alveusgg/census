import { useSuspenseQuery } from '@tanstack/react-query';

export const usePreload = (url: string) => {
  return useSuspenseQuery({
    queryKey: ['preload', url],
    queryFn: () => {
      return new Promise<null>(resolve => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(null);
        img.onerror = () => resolve(null);
      });
    }
  });
};
