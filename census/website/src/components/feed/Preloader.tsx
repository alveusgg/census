import { FC, PropsWithChildren, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

export const Preloader: FC<PropsWithChildren> = ({ children }) => {
  const [ref, inView] = useInView();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (hasLoaded) return;
    if (inView) setHasLoaded(true);
  }, [inView, hasLoaded]);

  return (
    <div ref={ref} className="w-0 h-0">
      {hasLoaded && children}
    </div>
  );
};
