import { cn } from '@/utils/cn';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, PropsWithChildren, SVGAttributes, useState } from 'react';

interface ObservationEntryProps {
  id: string;
  iNatId: number;
}

interface ObservationEntryActions {
  remove?: () => void;
}

export const ObservationEntry: FC<PropsWithChildren<ObservationEntryProps & ObservationEntryActions>> = ({
  id,
  iNatId,
  children,
  remove
}) => {
  return (
    <div key={id} className="px-3 flex flex-row-reverse gap-2 items-center w-full">
      <div className="peer group text-xs w-full flex justify-end gap-2">
        <p className={cn(remove && 'group-hover:hidden')}>self-reported</p>
        {remove && (
          <button className="text-red-600 hidden group-hover:block underline font-bold" onClick={remove}>
            remove this?
          </button>
        )}
      </div>
      <a
        href={`https://www.inaturalist.org/taxa/${iNatId}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'flex max-w-fit items-center cursor-pointer gap-1 py-1.5 w-full text-sm bg-transparent font-bold text-accent-800 outline-none',
          remove && 'peer-hover:text-red-600 peer-hover:line-through'
        )}
      >
        {children}
      </a>
    </div>
  );
};

export const ObservationEntryVote: FC<PropsWithChildren<ObservationEntryProps & ObservationEntryActions>> = ({
  id,
  iNatId,
  children
}) => {
  const [vote, setVote] = useState<'agree' | 'disagree' | undefined>();
  return (
    <div key={id} className="px-3 flex flex-row-reverse gap-2 items-center">
      <div className="peer group text-xs w-full flex justify-end gap-2">
        <div className={cn('flex justify-end cursor-pointer')}>
          <AnimatePresence mode="popLayout">
            <motion.button
              layout="position"
              type="button"
              className={cn(
                'text-purple-500 hover:text-purple-700 font-bold px-1.5 py-0.5 rounded-md',
                vote ? (vote === 'agree' ? 'bg-purple-500 text-white hover:text-white' : 'hidden') : ''
              )}
              onClick={() => setVote('agree')}
            >
              agree
            </motion.button>
            <button
              type="button"
              className={cn(
                'text-red-500 hover:text-red-700 font-bold px-1.5 py-0.5 rounded-md',
                vote ? (vote === 'disagree' ? 'bg-red-500 text-white hover:text-white' : 'hidden') : ''
              )}
              onClick={() => setVote('disagree')}
            >
              disagree
            </button>
          </AnimatePresence>
        </div>
      </div>
      <div className="flex items-center gap-1 font-bold">
        <span className="flex items-center gap-0.5 text-purple-500 text-sm">
          <UpThumb />
          <span>{vote === 'agree' ? 3 : 2}</span>
        </span>
        <span className="flex items-center gap-0.5 text-red-500 text-sm">
          <DownThumb />
          <span>{vote === 'disagree' ? 2 : 1}</span>
        </span>
      </div>
      <a
        href={`https://www.inaturalist.org/taxa/${iNatId}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'flex items-center cursor-pointer gap-1 py-1.5 min-w-fit text-sm bg-transparent font-bold text-accent-800 outline-none'
        )}
      >
        {children}
      </a>
    </div>
  );
};

const DownThumb: FC<SVGAttributes<SVGSVGElement>> = props => {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" {...props}>
      <path
        d="M3.47814 5.35651C3.38441 5.6005 3.13994 5.78264 2.87711 5.78264L0.511647 5.78264C0.211131 5.78264 -0.0029041 5.54445 0.0246403 5.24636L-4.53078e-07 0.600034C-4.5426e-07 0.586506 0.000482686 0.573462 0.00241525 0.559934C0.0439657 0.251205 0.329016 -2.18618e-05 0.638226 -2.18889e-05L3.65686 -2.21528e-05C3.95158 -2.21785e-05 4.1603 0.229956 4.14242 0.519834L3.48728 5.36046C3.48438 5.35902 3.48104 5.35748 3.47814 5.35651Z"
        fill="currentColor"
      />
      <path
        d="M11.1268 3.77656C11.0969 4.12779 10.9191 4.3858 10.6877 4.56988C10.8621 4.69405 10.9664 4.87474 10.9887 5.1023C11.0186 5.40668 10.9389 5.88451 10.6181 6.23044C10.4558 6.40486 10.1649 6.6126 9.70206 6.6126L7.54921 6.6126C7.54486 6.92422 7.54486 7.41269 7.56757 7.84655C7.60042 8.4727 7.25015 9.23651 6.90373 9.63712C6.72158 9.84825 6.53704 9.96663 6.3544 9.98886C6.29594 9.9961 6.23507 9.99997 6.17371 9.99997C5.77657 9.99997 5.30744 9.84151 5.21612 9.49315C5.17602 9.34192 5.21323 9.18201 5.25333 9.01339C5.30599 8.78921 5.37266 8.51044 5.30309 8.12054C5.18569 7.45911 4.18704 5.86083 3.86328 5.56757L4.53678 0.588291C4.9803 0.416296 6.00503 0.0418544 6.5438 0.0418543L9.23641 0.0418541C9.41952 0.0418541 10.0321 0.0819545 10.2167 0.596986C10.3051 0.845319 10.2713 1.07916 10.1853 1.2787C10.1843 1.29802 10.1834 1.31445 10.1829 1.32604C10.1829 1.33039 10.1824 1.33522 10.1819 1.34005C10.5182 1.42992 10.7361 1.65362 10.7936 1.98504C10.8631 2.38509 10.7428 2.66193 10.6221 2.82861C10.9786 2.99481 11.1645 3.32722 11.1268 3.77656Z"
        fill="currentColor"
      />
    </svg>
  );
};

const UpThumb: FC<SVGAttributes<SVGSVGElement>> = props => {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" {...props}>
      <path
        d="M3.47814 4.64346C3.38441 4.39947 3.13994 4.21733 2.87711 4.21733H0.511647C0.211131 4.21733 -0.00290408 4.45552 0.0246404 4.75361L0 9.39994C0 9.41346 0.000483142 9.42651 0.00241571 9.44004C0.0439662 9.74876 0.329016 9.99999 0.638227 9.99999H3.65686C3.95158 9.99999 4.1603 9.77001 4.14242 9.48013L3.48728 4.6395C3.48438 4.64095 3.48104 4.64249 3.47814 4.64346Z"
        fill="currentColor"
      />
      <path
        d="M11.1268 6.22341C11.0969 5.87217 10.9191 5.61417 10.6877 5.43009C10.8621 5.30592 10.9664 5.12523 10.9887 4.89767C11.0186 4.59329 10.9389 4.11546 10.6181 3.76953C10.4558 3.59511 10.1649 3.38737 9.70206 3.38737H7.54921C7.54486 3.07575 7.54486 2.58728 7.56757 2.15342C7.60042 1.52727 7.25015 0.763459 6.90373 0.362845C6.72158 0.151716 6.53703 0.0333383 6.3544 0.0111123C6.29594 0.00386523 6.23507 0 6.17371 0C5.77657 0 5.30744 0.158464 5.21612 0.506821C5.17602 0.65805 5.21323 0.817961 5.25333 0.98658C5.30599 1.21076 5.37266 1.48953 5.30309 1.87943C5.18569 2.54086 4.18704 4.13914 3.86328 4.4324L4.53678 9.41168C4.9803 9.58367 6.00503 9.95811 6.5438 9.95811H9.23641C9.41952 9.95811 10.0321 9.91801 10.2167 9.40298C10.3051 9.15465 10.2713 8.92081 10.1853 8.72127C10.1843 8.70195 10.1834 8.68552 10.1829 8.67392C10.1829 8.66958 10.1824 8.66475 10.1819 8.65991C10.5182 8.57005 10.7361 8.34635 10.7936 8.01493C10.8631 7.61488 10.7428 7.33804 10.6221 7.17136C10.9786 7.00516 11.1645 6.67275 11.1268 6.22341Z"
        fill="currentColor"
      />
    </svg>
  );
};
