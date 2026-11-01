import { Section, Step } from '@/components/wrapped';
import { motion } from 'framer-motion';
import { FC } from 'react';
import { Reveal, Slide, StickerCluster } from './primitives';

import butterfly from '@/assets/adult_butterfly.outlined.png';
import ladybird from '@/assets/adult_ladybird.outlined.png';
import anthill from '@/assets/anthill.outlined.png';
import flower from '@/assets/flower.outlined.png';
import magnifier from '@/assets/magnifying-glass.outlined.png';

/** Title card. */
export const CoverSection: FC = () => (
  <Section wait={1200}>
    <Step>
      <Slide className="wide:gap-6">
        <StickerCluster
          className="h-56 w-full shrink-0 wide:order-2 wide:h-full wide:flex-1"
          stickers={[
            { src: anthill, x: 50, y: 54, size: 62, rotate: 3 },
            { src: butterfly, x: 14, y: 26, size: 26, rotate: -14, delay: 0.35 },
            { src: ladybird, x: 86, y: 28, size: 18, rotate: 12, delay: 0.5 },
            { src: magnifier, x: 84, y: 82, size: 20, rotate: -20, delay: 0.65 },
            { src: flower, x: 14, y: 80, size: 18, rotate: 8, delay: 0.8 }
          ]}
        />
        <div className="flex flex-col items-center gap-2 text-center wide:order-1 wide:w-[24rem] wide:flex-none wide:items-start wide:text-left">
          <Reveal>
            <h2 className="font-serif text-6xl font-bold leading-[0.95] text-accent-900 wide:text-7xl">
              season one,
              <br />
              <motion.span
                initial={{ opacity: 0, rotate: -6, scale: 0.6 }}
                animate={{ opacity: 1, rotate: -2, scale: 1 }}
                transition={{ delay: 0.55, type: 'spring', stiffness: 260, damping: 14 }}
                className="mt-1 inline-block rounded-xl bg-accent-400 px-3 pb-1.5 pt-0.5 text-accent-950 shadow-[inset_0_-6px_0_-0.1rem_rgba(0,0,0,0.12)]"
              >
                wrapped
              </motion.span>
            </h2>
          </Reveal>
        </div>
      </Slide>
    </Step>
  </Section>
);
