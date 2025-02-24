import SiChevronDown from '@/components/icons/SiChevronDown';
import { useModal } from '@/components/modal/useModal';
import { Shiny, useCurrentSeason, useShiniesForSeason } from '@/services/api/seasons';
import { Variables } from '@/services/backstage/config';
import { cn } from '@/utils/cn';
import { useVariable } from '@alveusgg/backstage';
import { useMeasure } from '@uidotdev/usehooks';
import { addMonths, format } from 'date-fns';
import { motion } from 'framer-motion';
import { ComponentProps, FC, useMemo, useState } from 'react';
import { IdentificationModal, IdentificationProps } from './Identification';

export const ShiniesForSeason = () => {
  const season = useCurrentSeason();
  const shinies = useShiniesForSeason(season.data.id);

  const [ref, { height }] = useMeasure();
  const [expanded, setExpanded] = useState(false);

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
        className="bg-accent-50 border border-accent border-opacity-50 px-12 pt-10 pb-6 text-accent-900 leading-5 flex flex-col"
      >
        <motion.div transition={!expanded ? { duration: 0 } : undefined} layout className="flex gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <h1 className="text-4xl font-bold">Dr. Allison's Shiny Bugs</h1>
            <p className="text-balance">
              our resident entomologist has selected 24 special bugs that she wants to find. this resets every season so
              get spotting and maybe you’ll unlock one and earn the{' '}
              <span className="font-bold">rodential energy sticker!</span>
            </p>
          </div>
          <div className="flex">
            <div className="text-right">
              <h3 className="text-2xl font-bold">generation one</h3>
              <p className="font-semibold">
                {format(new Date(), 'MMM yyyy')} - {format(addMonths(new Date(), 11), 'MMM yyyy')}
              </p>
            </div>
          </div>
        </motion.div>
        <div className="relative">
          {!expanded && (
            <div className="w-8 absolute right-0 top-0 bottom-0 h-full bg-gradient-to-r from-transparent to-accent-50 z-10"></div>
          )}
          <div className="overflow-x-scroll relative" style={{ height: height ?? 0 }}>
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
                  className="min-w-28 relative mx-1 my-1 group"
                  transition={!expanded ? { duration: 0 } : undefined}
                  layoutId={shiny.id.toString()}
                  layout
                  key={shiny.id}
                >
                  <ShinyThumbnail shiny={shiny} />
                </motion.button>
              ))}
            </div>
          </div>
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
      {'key' in shiny && (
        <>
          <Shine />
          <EncryptedImg
            src={`/images/${shiny.assetId}.encrypted.png`}
            iv={shiny.key}
            className={cn(
              'absolute inset-0 drop-shadow-md rotate-1 group-hover:scale-[1.1] group-hover:rotate-2 cursor-pointer transition-all duration-300'
            )}
          />
        </>
      )}
      <img src={`/images/${shiny.assetId}.svg`} />
    </>
  );
};

export const EncryptedImg: FC<ComponentProps<'img'> & { iv: string }> = ({ iv, src, ...props }) => {
  const imageEncryptionKey = useVariable<Variables>('imageEncryptionKey');
  return (
    <img
      key={src}
      data-retried={false}
      onError={e => {
        const attr = e.currentTarget.getAttribute('data-retried');
        if (attr === 'true') return;
        e.currentTarget.setAttribute('data-retried', 'true');
        e.currentTarget.src = e.currentTarget.src;
      }}
      src={`${src}?key=${imageEncryptionKey}&iv=${iv}`}
      {...props}
    />
  );
};
