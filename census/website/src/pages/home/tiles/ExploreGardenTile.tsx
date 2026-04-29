import { ChevronRight } from 'lucide-react';
import { FC } from 'react';
import { Link } from 'react-router-dom';

export const ExploreGardenTile: FC = () => {
  return (
    <div className="flex items-center gap-4 py-4 md:pl-6 md:py-2 @container">
      <div className="w-20 md:w-28 h-16 shrink-0 rounded-lg bg-accent-100" aria-label="Pano preview placeholder" />
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <h3 className="font-serif text-xl font-bold text-accent-900 leading-tight">explore the garden</h3>
        <Link
          to="/identifications"
          className="group inline text-sm text-accent-800 hover:text-accent-700 transition-colors leading-snug"
        >
          See the 360° pano and see if you can spot anything!{' '}
          <ChevronRight className="size-4 inline-block align-text-bottom transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
};
