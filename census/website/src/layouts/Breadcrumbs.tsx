import * as Portal from '@radix-ui/react-portal';
import { useSuspenseQuery } from '@tanstack/react-query';
import { FC, PropsWithChildren } from 'react';

const id = 'breadcrumbs';
export const Breadcrumbs: FC<PropsWithChildren> = ({ children }) => {
  /*
  I know this looks and works in a crazy way, but I really wanted
  to hoist the breadcrumbs up to the header from anywhere for better UX & DX.

  Portals make this easy, but they require a container and on the first render
  the breadcrumbs don't exist, so we have to wait until they do. This takes such
  a small amount of time in practice but it could add a flash if it wasn't for
  suspense.
  */
  const element = useSuspenseQuery({
    queryKey: [id],
    queryFn: async () => {
      const element = document.getElementById(id);
      if (element) return element;

      return new Promise<Element>(resolve => {
        const interval = setInterval(() => {
          const element = document.getElementById(id);
          if (element) {
            resolve(element);
            clearInterval(interval);
          }
        }, 10);
      });
    },
    staleTime: Infinity
  });

  return (
    <Portal.Root className="flex items-center justify-center gap-2" container={element.data}>
      {children}
    </Portal.Root>
  );
};
