import { Section, Step } from '@/components/wrapped';
import { AnimatePresence, motion } from 'framer-motion';
import { FC } from 'react';
import { season } from './data';
import { CountUp, formatNumber, FramedImg, random, Slide, Stat, useTicker } from './primitives';

import camera from '@/assets/polaroid-capture.outlined.png';

export const CapturesSection: FC = () => (
  <Section wait={3000}>
    <Step>
      <Slide className="wide:gap-8">
        <Stat
          value={<CountUp value={season.captures} />}
          caption={`captures made from ${formatNumber(season.clips)} clips of the garden`}
          className="shrink-0 wide:w-[21rem]"
        >
          <motion.img
            src={camera}
            alt=""
            initial={{ opacity: 0, scale: 0.4, rotate: -30, y: 20 }}
            animate={{ opacity: 1, scale: 1, rotate: -8, y: 0 }}
            transition={{
              delay: 0.5,
              type: 'spring',
              stiffness: 240,
              damping: 14
            }}
            className="mt-3 hidden w-24 drop-shadow-lg wide:block"
          />
        </Stat>
        <PolaroidStage />
      </Slide>
    </Step>
  </Section>
);

const PILE = 7;

/**
 * Polaroids rise from the bottom of the stage and land on top of the pile,
 * continuously, until the viewer moves on. Once the pile is deep enough the
 * bottom-most polaroid fades away underneath the others.
 */
const PolaroidStage: FC = () => {
  const images = season.selections.captures;
  const tick = useTicker(1100);
  if (images.length === 0) return null;

  const end = tick + 1;
  const start = Math.max(0, end - PILE);
  const pile = Array.from({ length: end - start }, (_, index) => start + index);

  return (
    <div className="relative min-h-0 w-full flex-1 overflow-hidden wide:h-full wide:self-stretch">
      <AnimatePresence>
        {pile.map(position => {
          const image = images[position % images.length];
          return (
            <motion.div
              key={position}
              // Only opacity here: the wrapper is centred with CSS transforms, which framer would replace.
              exit={{ opacity: 0, transition: { duration: 0.7, ease: 'easeIn' } }}
              className="absolute left-1/2 top-1/2 w-40 -translate-x-1/2 -translate-y-[56%] wide:w-52"
            >
              <motion.div
                initial={{ y: '260%', rotate: 0, scale: 0.9 }}
                animate={{
                  // Percentages of the polaroid itself, so the spread scales with the layout.
                  x: `${(random(position) - 0.5) * 105}%`,
                  y: `${(random(position + 0.5) - 0.5) * 22}%`,
                  rotate: (random(position + 0.25) - 0.5) * 26,
                  scale: 1
                }}
                exit={{ scale: 0.9, transition: { duration: 0.7, ease: 'easeIn' } }}
                transition={{ type: 'spring', stiffness: 130, damping: 17 }}
                className="rounded-sm border border-accent border-opacity-50 bg-white p-2.5 pb-9 shadow-[0_14px_34px_rgba(97,58,24,0.2)] wide:p-3 wide:pb-10"
              >
                <FramedImg
                  image={image}
                  alt={image.nickname}
                  className="aspect-square w-full bg-accent-100 object-cover"
                />
                <p className="absolute inset-x-3 bottom-2.5 truncate text-center font-serif text-sm text-accent-900 wide:text-base">
                  {image.nickname}
                </p>
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
