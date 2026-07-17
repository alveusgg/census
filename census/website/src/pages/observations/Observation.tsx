import { Note } from '@/components/containers/Note';
import type { Observation as ObservationType } from '@/services/api/observations';
import { cn } from '@/utils/cn';
import type { FC } from 'react';
import { ObservationProvider } from './ObservationContext';
import { ObservationDetails } from './ObservationDetails';
import { ObservationCardHeader } from './ObservationHeader';
import { ObservationCardMedia } from './ObservationMedia';

interface ObservationProps {
  className?: string;
  observation: ObservationType;
}

export const Observation: FC<ObservationProps> = ({ className, observation }) => {
  return (
    <ObservationProvider observation={observation}>
      <article className={cn('@container', className)}>
        <div className="flex flex-col gap-4 @lg:flex-row">
          <ObservationCardMedia />
          <Note className="h-fit w-full">
            <ObservationCardHeader className="px-4 pb-2 pt-4" />
            <ObservationDetails />
          </Note>
        </div>
      </article>
    </ObservationProvider>
  );
};
