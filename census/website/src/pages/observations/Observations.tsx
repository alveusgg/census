import { SelectionProvider } from '@/components/selection/SelectionProvider';
import { Breadcrumbs } from '@/layouts/Breadcrumbs';
import { useObservations } from '@/services/api/observations';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { FC, PropsWithChildren, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Observation } from './Observation';

export const Observations = () => {
  return (
    <SelectionProvider>
      <ObservationsContent />
    </SelectionProvider>
  );
};

const ObservationsContent = () => {
  const query = useObservations();
  const result = useSuspenseInfiniteQuery(query);
  const observations = result.data.pages.flatMap(page => page.data);

  return (
    <div className="flex flex-col gap-4 w-full mx-auto max-w-4xl">
      <Breadcrumbs>
        <p>home</p>
        <span>•</span>
        <p className="text-lg">observations</p>
      </Breadcrumbs>
      {observations.map(observation => (
        <Observation observation={observation} />
      ))}
    </div>
  );
};

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
