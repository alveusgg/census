import { Note } from '@/components/containers/Note';
import { useObservation } from '@/services/api/observations';
import { cn } from '@/utils/cn';
import { useSuspenseQuery } from '@tanstack/react-query';
import { type FC, useMemo } from 'react';
import { useParams } from 'react-router';
import { ObservationProvider } from './ObservationContext';
import { ObservationDetails } from './ObservationDetails';
import { ObservationPageHeader } from './ObservationHeader';
import { ObservationPageMedia } from './ObservationMedia';

export const ObservationPage = () => {
  const params = useParams<{ id: string }>();
  const observationId = useMemo(() => Number(params.id), [params.id]);
  const { data: observation } = useSuspenseQuery(useObservation(observationId));

  return (
    <ObservationProvider observation={observation}>
      <ObservationPageContent />
    </ObservationProvider>
  );
};

const ObservationPageContent: FC<{ className?: string }> = ({ className }) => {
  return (
    <main className={cn('@container mx-auto w-full max-w-[1600px]', className)}>
      <ObservationPageHeader className="pb-5" />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(22rem,2fr)]">
        <ObservationPageMedia />
        <Note className="h-fit min-w-0">
          <div className="px-4 pt-3"></div>
          <ObservationDetails />
        </Note>
      </div>
    </main>
  );
};
