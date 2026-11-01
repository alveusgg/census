import { Section, Step } from '@/components/wrapped';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';
import { FC } from 'react';
import { FoundShiny, season } from './data';
import { CountUp, formatNumber, Headline, Slide, Stat } from './primitives';

const shinies = season.selections.shinies;
const spotters = new Set(shinies.flatMap(shiny => shiny.usernames)).size;

export const ShiniesSection: FC = () => (
  <Section wait={2500}>
    <Step>
      <Slide className="wide:gap-10">
        <Stat
          value={<CountUp value={season.shiniesFound} />}
          caption={`shinies found by ${formatNumber(spotters)} lucky spotters`}
          className="shrink-0 wide:w-[21rem]"
        />
        <div className="grid w-full max-w-xs grid-cols-3 gap-3 wide:max-w-none wide:flex-1 wide:gap-4">
          {shinies.map((shiny, index) => (
            <motion.img
              key={shiny.id}
              src={shiny.artwork}
              alt={shiny.nickname}
              initial={{ opacity: 0, scale: 0.3, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: index % 2 ? 4 : -4 }}
              transition={{ delay: 0.4 + index * 0.12, type: 'spring', stiffness: 260, damping: 14 }}
              className="aspect-square w-full object-contain drop-shadow-md"
            />
          ))}
        </div>
      </Slide>
    </Step>

    {shinies.map(shiny => (
      <Step key={shiny.id}>
        <ShinySlide shiny={shiny} />
      </Step>
    ))}
  </Section>
);

const SPARKLES = 12;
const LAND = 0.45;

/** A diagonal band mask; `sheen` keyframes slide it across the sticker. */
const sheenMask = (width: string, delay: number) => {
  const gradient = `linear-gradient(115deg, transparent 0%, transparent calc(50% - ${width}), white 50%, transparent calc(50% + ${width}), transparent 100%)`;
  return {
    WebkitMaskImage: gradient,
    maskImage: gradient,
    WebkitMaskSize: '300% 100%',
    maskSize: '300% 100%',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: '100% 0%',
    maskPosition: '100% 0%',
    animation: `wrapped-sheen 4.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s infinite`
  };
};

/**
 * The sticker drops in and lands, sparkles burst and a glow pulses behind it,
 * a gloss sweeps across the sticker itself, then the people who found it appear.
 *
 * The gloss is a copy of the artwork turned pure white with CSS filters, then
 * revealed through a moving gradient mask. That keeps it clipped to the
 * sticker's exact shape without needing cross-origin access to the image.
 */
const ShinySlide: FC<{ shiny: FoundShiny }> = ({ shiny }) => {
  const namesAt = 1.7;

  return (
    <Slide className="gap-3 wide:gap-10">
      <div className="relative size-52 shrink-0 wide:mx-4 wide:size-72">
        {/* Glow */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 1, 0.6], scale: [0.6, 1.2, 1.05] }}
          transition={{ delay: LAND, duration: 1.2, ease: 'easeOut' }}
          className="absolute inset-[-6%] rounded-full bg-[radial-gradient(closest-side,rgba(247,207,70,0.65),rgba(247,207,70,0.25)_45%,transparent_72%)]"
        />

        {/* Sparkles bursting outward on landing */}
        {Array.from({ length: SPARKLES }, (_, index) => {
          const angle = (index / SPARKLES) * Math.PI * 2 + (index % 2) * 0.2;
          const distance = 0.5 + ((index * 7) % 5) / 10;
          return (
            <motion.span
              key={index}
              aria-hidden
              initial={{ x: 0, y: 0, scale: 0, opacity: 0, rotate: 0 }}
              animate={{
                x: `${Math.cos(angle) * distance * 60}%`,
                y: `${Math.sin(angle) * distance * 60}%`,
                scale: [0, 1.2, 0],
                opacity: [0, 1, 0],
                rotate: 90
              }}
              transition={{ delay: LAND + index * 0.03, duration: 0.9, ease: 'easeOut' }}
              style={{ clipPath: 'polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%)' }}
              className={cn(
                'absolute left-1/2 top-1/2 -ml-3 -mt-3 size-6',
                index % 3 === 0 ? 'bg-white' : index % 3 === 1 ? 'bg-accent-400' : 'bg-accent-600'
              )}
            />
          );
        })}

        {/* Sticker */}
        <motion.div
          initial={{ opacity: 0, scale: 0.3, rotate: -30, y: -140 }}
          animate={{ opacity: 1, scale: 1, rotate: -4, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 15, mass: 0.9 }}
          className="relative size-full"
        >
          <img src={shiny.artwork} alt={shiny.nickname} className="size-full object-contain drop-shadow-xl" />

          {/* Gloss: wide soft band, then a thin bright one just behind it */}
          <img
            aria-hidden
            src={shiny.artwork}
            alt=""
            style={sheenMask('14%', 0.9)}
            className="pointer-events-none absolute inset-0 size-full object-contain opacity-70 [filter:brightness(0)_invert(1)]"
          />
          <img
            aria-hidden
            src={shiny.artwork}
            alt=""
            style={sheenMask('4%', 1.0)}
            className="pointer-events-none absolute inset-0 size-full object-contain opacity-90 [filter:brightness(0)_invert(1)]"
          />
        </motion.div>
      </div>

      <div className="flex min-w-0 flex-col items-center gap-2 text-center wide:w-[26rem] wide:items-start wide:gap-3 wide:text-left">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.4 }}
        >
          <Headline className="text-accent-900">{shiny.nickname}</Headline>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: namesAt - 0.2 }}
          className="text-base font-semibold text-accent-800 wide:text-lg"
        >
          found by {shiny.usernames.length === 1 ? 'one spotter' : `${shiny.usernames.length} spotters`}
        </motion.p>
        <div className="flex flex-wrap justify-center gap-1.5 wide:justify-start wide:gap-2">
          {shiny.usernames.map((username, index) => (
            <Chip key={username} delay={namesAt + index * 0.05} compact={shiny.usernames.length > 6}>
              {username}
            </Chip>
          ))}
        </div>
      </div>
    </Slide>
  );
};

const Chip: FC<{ delay: number; compact?: boolean; className?: string; children: React.ReactNode }> = ({
  delay,
  compact,
  className,
  children
}) => (
  <motion.span
    initial={{ opacity: 0, y: 16, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, type: 'spring', stiffness: 320, damping: 20 }}
    className={cn(
      'rounded-full border border-accent border-opacity-50 bg-white/70 px-3 py-1 font-bold text-accent-900',
      compact ? 'text-xs wide:text-sm' : 'text-sm wide:text-lg',
      className
    )}
  >
    {children}
  </motion.span>
);
