import { useUnconfirmedObservationCount } from '@/services/api/observations';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { FC } from 'react';
import { Link } from 'react-router-dom';

import capture from '@/assets/capture.png';

export const IdentifyCrittersTile: FC = () => {
  const unconfirmedQuery = useSuspenseQuery(useUnconfirmedObservationCount());
  const unconfirmedCount = unconfirmedQuery.data;

  return (
    <Link to="/observations" className="group flex items-center gap-4 py-4 md:px-6 md:py-2 @container">
      <div className="w-20 md:w-16 h-16 shrink-0" aria-label="Focus target placeholder">
        <img src={capture} alt="Focus target" className="w-full h-full object-contain" />
      </div>
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <h3 className="font-serif text-xl font-bold text-accent-900 leading-tight">help identify critters!</h3>
        <p className="text-sm text-accent-800 transition-colors leading-snug group-hover:text-accent-700">
          There are currently <span className="font-bold text-accent-900">{unconfirmedCount}</span> critters that need
          to be identified – you can help out!{' '}
          <ChevronRight className="size-4 inline-block align-text-bottom transition-transform group-hover:translate-x-0.5" />
        </p>
      </div>
    </Link>
  );
};
