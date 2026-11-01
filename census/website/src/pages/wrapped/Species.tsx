import { Section, Step } from '@/components/wrapped';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { FC } from 'react';
import { season } from './data';
import { CountUp, Reveal, Slide } from './primitives';

import butterfly from '@/assets/adult_butterfly.outlined.png';
import ladybird from '@/assets/adult_ladybird.outlined.png';
import spider from '@/assets/adult_spider.outlined.png';
import beetle from '@/assets/adult_stag_beetle.outlined.png';
import caterpillar from '@/assets/caterpillar.outlined.png';
import magnifier from '@/assets/magnifying-glass.outlined.png';

/** A fan of critter stickers that pop in one after another, then bob gently. */
const residents = [
  { src: caterpillar, rotate: -16, y: 10 },
  { src: ladybird, rotate: -8, y: 2 },
  { src: butterfly, rotate: 0, y: -6 },
  { src: beetle, rotate: 8, y: 2 },
  { src: spider, rotate: 16, y: 10 }
];

export const SpeciesSection: FC = () => (
  <Section wait={3000}>
    <Step>
      <Slide className="justify-center gap-6 wide:gap-0">
        <Figure
          value={<CountUp value={season.speciesConfirmed} duration={1.6} />}
          caption="different species confirmed"
          art={
            <div className="flex items-end justify-center -space-x-3 wide:-space-x-4">
              {residents.map((sticker, index) => (
                <motion.img
                  key={index}
                  src={sticker.src}
                  alt=""
                  initial={{ opacity: 0, scale: 0.3, y: 24, rotate: sticker.rotate - 20 }}
                  animate={{ opacity: 1, scale: 1, y: sticker.y, rotate: sticker.rotate }}
                  transition={{ delay: 0.2 + index * 0.1, type: 'spring', stiffness: 260, damping: 14 }}
                  style={{ zIndex: index === 2 ? 2 : 1 }}
                  className="w-12 drop-shadow-md wide:w-16"
                />
              ))}
            </div>
          }
        />

        <div aria-hidden className="h-px w-40 bg-accent-300 wide:h-44 wide:w-px" />

        <Figure
          delay={0.5}
          value={
            <span className="inline-flex items-center gap-2 wide:gap-3">
              <CountUp value={season.identificationsConfirmed} duration={1.6} delay={0.8} />
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 2.3, duration: 0.5 }}
              >
                <Heart className="size-9 fill-accent-400 stroke-accent-700 wide:size-14" />
              </motion.span>
            </span>
          }
          caption="identifications confirmed by the experts"
          art={
            <motion.img
              src={magnifier}
              alt=""
              initial={{ opacity: 0, scale: 0.3, rotate: -40 }}
              animate={{ opacity: 1, scale: 1, rotate: -12 }}
              transition={{ delay: 0.7, type: 'spring', stiffness: 240, damping: 14 }}
              className="w-14 drop-shadow-md wide:w-20"
            />
          }
        />
      </Slide>
    </Step>
  </Section>
);

interface FigureProps {
  value: React.ReactNode;
  caption: string;
  art: React.ReactNode;
  delay?: number;
}

/** A big centred number with a sticker above and a caption below. */
const Figure: FC<FigureProps> = ({ value, caption, art, delay = 0 }) => (
  <div className="flex flex-col items-center gap-1 text-center wide:flex-1 wide:gap-2">
    <div className="flex h-16 items-end wide:h-24">{art}</div>
    <Reveal delay={delay + 0.1}>
      <div className="text-6xl font-black leading-none tracking-wide text-accent-900 wide:text-8xl">{value}</div>
    </Reveal>
    <Reveal delay={delay + 0.4}>
      <p className="max-w-[16rem] text-balance text-base font-semibold leading-tight text-accent-800 wide:max-w-xs wide:text-xl">
        {caption}
      </p>
    </Reveal>
  </div>
);
