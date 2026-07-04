import SiChevronDown from '@/components/icons/SiChevronDown';
import { useModal } from '@/components/modal/useModal';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { loadSilhouette } from '@/lib/levels';
import { Shiny, useCurrentSeason, useShiniesForSeason } from '@/services/api/seasons';
import { cn } from '@/utils/cn';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useMeasure } from '@uidotdev/usehooks';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ComponentProps, CSSProperties, FC, useMemo, useState } from 'react';
import { IdentificationModal, IdentificationProps } from './Identification';

export const ShiniesForSeason = () => {
  const seasonQuery = useCurrentSeason();
  const shiniesQuery = useShiniesForSeason();
  const season = useSuspenseQuery(seasonQuery);
  const shinies = useSuspenseQuery(shiniesQuery);

  const [ref, { height }] = useMeasure();
  const [expanded, setExpanded] = useState(false);
  const shinyCount = shinies.data.length;
  const shinyBugLabel = shinyCount === 1 ? 'special bug' : 'special bugs';

  const identificationModalProps = useModal<IdentificationProps>();

  return (
    <div className="w-full @container">
      <IdentificationModal {...identificationModalProps} />
      <motion.div
        layout="size"
        animate={{
          borderRadius: 16
        }}
        transition={!expanded ? { duration: 0 } : undefined}
        className="bg-accent-100 border border-accent border-opacity-50 px-12 pt-10 pb-6 text-accent-900 leading-5 flex flex-col"
      >
        <motion.div transition={!expanded ? { duration: 0 } : undefined} layout className="flex gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <h1 className="text-4xl tracking-wide font-serif font-bold text-accent-900">Shiny Bugs</h1>
            <p className="text-balance">
              our resident entomologists have selected {shinyCount} {shinyBugLabel} that they want to find. this resets
              every season so get spotting and maybe you’ll unlock one and earn the{' '}
              <span className="font-bold">rodential energy sticker!</span>
            </p>
          </div>
          <div className="flex">
            <div className="text-right">
              <h3 className="text-2xl font-bold">generation one</h3>
              <p className="font-semibold">
                {format(new Date(season.data.startDate), 'MMM yyyy')} -{' '}
                {format(new Date(season.data.endDate), 'MMM yyyy')}
              </p>
            </div>
          </div>
        </motion.div>
        <div className="relative">
          {!expanded && (
            <div className="w-8 absolute right-0 top-0 bottom-0 h-full bg-gradient-to-r from-transparent to-accent-100 z-10"></div>
          )}
          <ScrollArea className="relative overflow-y-hidden" style={{ height: height ?? 0 }}>
            <div
              ref={ref}
              className={cn(
                'pb-3',
                expanded
                  ? 'grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4 pt-12'
                  : 'grid grid-flow-col absolute pt-3'
              )}
            >
              {shinies.data.map(shiny => (
                <motion.button
                  onClick={() => {
                    if ('identificationId' in shiny && shiny.identificationId) {
                      identificationModalProps.open({ identificationId: shiny.identificationId });
                    }
                  }}
                  className="min-w-28 aspect-square relative mx-1 my-1 group"
                  transition={!expanded ? { duration: 0 } : undefined}
                  layoutId={shiny.id.toString()}
                  layout
                  key={shiny.id}
                >
                  <ShinyThumbnail shiny={shiny} />
                </motion.button>
              ))}
            </div>
            {!expanded && <ScrollBar orientation="horizontal" />}
          </ScrollArea>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-accent-900 flex text-sm mx-auto items-center">
          <SiChevronDown className={cn('transition-transform duration-300 text-xl', expanded && 'rotate-180')} />
          <span>{expanded ? 'show less' : 'show more'}</span>
        </button>
      </motion.div>
    </div>
  );
};

interface ShinyThumbnailProps {
  shiny: Shiny;
}

const Shine: FC<ComponentProps<'div'>> = props => (
  <div
    {...props}
    style={{
      background: `linear-gradient(160deg, rgba(255, 255, 255, 0.00) 3.49%, rgba(255, 255, 255, 0.00) 37.36%, rgba(255, 255, 255, 0.30) 45.31%, rgba(255, 255, 255, 0.00) 54.09%, rgba(255, 255, 255, 0.00) 87.13%)`
    }}
    className="absolute bg-blend-screen inset-x-0 bottom-0 -top-1/2 group-hover:top-1/2 opacity-0 group-hover:opacity-75 transition-all duration-300 z-10 pointer-events-none"
  ></div>
);

export const ShinyThumbnail: FC<ShinyThumbnailProps> = ({ shiny }) => {
  // This doesn't need to be reactive, we really only care if the user has seen it on a previous page load
  const hasBeenSeen = useMemo(() => localStorage.getItem(`shiny-unlocked-and-new:${shiny.id}`) === 'true', [shiny]);
  const artwork = 'artwork' in shiny && shiny.artwork.type === 'url' ? shiny.artwork : null;

  return (
    <>
      {!hasBeenSeen && 'identificationId' in shiny && (
        <div
          style={{
            width: 16,
            height: 16
          }}
          className="rounded-full bg-red-500 border-red-700 border-2 absolute top-3 right-1 z-10"
        ></div>
      )}
      {artwork && (
        <>
          <Shine />
          <img
            src={artwork.url}
            className="absolute inset-0 size-full object-contain bg-center drop-shadow-md rotate-1 group-hover:scale-[1.1] group-hover:rotate-2 cursor-pointer transition-all duration-300"
          />
        </>
      )}
      {!artwork && shiny.silhouette.type === 'assets' && (
        <Image className="absolute inset-0 size-full object-contain" src={shiny.silhouette.name} />
      )}
    </>
  );
};

export const Image: FC<ComponentProps<'span'> & { src: string }> = ({ src, className, style, ...props }) => {
  const source = useSuspenseQuery({
    queryKey: ['image', src],
    queryFn: async () => {
      const imageSrc = await loadSilhouette(src);
      if (!imageSrc) throw new Error(`Silhouette ${src} not found`);
      return imageSrc;
    }
  });

  const silhouetteStyle: CSSProperties = {
    WebkitMaskImage: `url(${source.data})`,
    WebkitMaskPosition: 'center',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskSize: 'contain',
    maskImage: `url(${source.data})`,
    maskPosition: 'center',
    maskRepeat: 'no-repeat',
    maskSize: 'contain',
    ...style
  };

  return (
    <span
      aria-hidden="true"
      {...props}
      className={cn('block bg-[#F2E8BF] dark:bg-[#8B977F]', className)}
      style={silhouetteStyle}
    />
  );
};
