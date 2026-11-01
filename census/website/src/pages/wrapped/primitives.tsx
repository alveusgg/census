import { Img } from '@/components/assets/images/Img';
import { cn } from '@/utils/cn';
import { animate, AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { useMeasure } from '@uidotdev/usehooks';
import { ComponentProps, FC, PropsWithChildren, ReactNode, useEffect, useState } from 'react';
import ReactConfetti from 'react-confetti';
import { BoundingBox, FramedImage } from './data';

export const formatNumber = (value: number) => Math.round(value).toLocaleString('en-US');

/**
 * Fills the stage. Stacks vertically in the portrait layout and sits side by
 * side in landscape. The enclosing Step handles the slide in/out.
 */
export const Slide: FC<PropsWithChildren<{ className?: string }>> = ({ children, className }) => (
  <div className={cn('flex size-full flex-col items-center justify-center gap-5 wide:flex-row wide:gap-12', className)}>
    {children}
  </div>
);

/** Fades a child in after `delay` seconds. */
export const Reveal: FC<PropsWithChildren<{ delay?: number; className?: string }>> = ({
  children,
  delay = 0,
  className
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

export const Eyebrow: FC<PropsWithChildren<{ className?: string }>> = ({ children, className }) => (
  <p className={cn('text-sm font-bold text-accent-700 wide:text-base', className)}>{children}</p>
);

interface StatProps {
  eyebrow?: ReactNode;
  value: ReactNode;
  caption: ReactNode;
  className?: string;
  valueClassName?: string;
  captionClassName?: string;
  /** Seconds before the first line appears. */
  delay?: number;
  children?: ReactNode;
}

/** Eyebrow, headline number and caption, cascading in one after another. */
export const Stat: FC<StatProps> = ({
  eyebrow,
  value,
  caption,
  className,
  valueClassName,
  captionClassName,
  delay = 0,
  children
}) => (
  <div className={cn('flex flex-col items-center gap-1.5 text-center wide:items-start wide:text-left', className)}>
    {eyebrow && (
      <Reveal delay={delay}>
        <Eyebrow>{eyebrow}</Eyebrow>
      </Reveal>
    )}
    <Reveal delay={delay + 0.1}>
      <div
        className={cn(
          'text-[3.75rem] font-black leading-[0.95] tracking-wide text-accent-900 wide:text-8xl',
          valueClassName
        )}
      >
        {value}
      </div>
    </Reveal>
    <Reveal delay={delay + 0.35}>
      <p
        className={cn(
          'max-w-xs text-balance text-lg font-semibold leading-tight text-accent-800 wide:max-w-sm wide:text-xl',
          captionClassName
        )}
      >
        {caption}
      </p>
    </Reveal>
    {children}
  </div>
);

/** Serif headline used in place of a number on text-only slides. */
export const Headline: FC<PropsWithChildren<{ className?: string }>> = ({ children, className }) => (
  <span className={cn('text-balance font-serif text-4xl font-bold leading-[1.05] wide:text-6xl', className)}>
    {children}
  </span>
);

interface CountUpProps extends Omit<ComponentProps<typeof motion.span>, 'children'> {
  value: number;
  duration?: number;
  delay?: number;
}

/** Counts from zero to `value` on mount with thousands separators, then gives a little pop on landing. */
export const CountUp: FC<CountUpProps> = ({ value, duration = 1.4, delay = 0.3, className, ...props }) => {
  const count = useMotionValue(0);
  const text = useTransform(count, formatNumber);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    setLanded(false);
    const controls = animate(count, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onComplete: () => setLanded(true)
    });
    return () => controls.stop();
  }, [count, value, duration, delay]);

  return (
    <motion.span
      animate={landed ? { scale: [1, 1.07, 1] } : { scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn('inline-block tabular-nums', className)}
      {...props}
    >
      {text}
    </motion.span>
  );
};

/** Square crop centred on the bounding box, padded so there's a little context around the critter. */
const frame = (box: BoundingBox, image: { width: number; height: number }, padding: number) => {
  const size = Math.round(Math.min(Math.max(box.width, box.height) * padding, image.width, image.height));
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const x = Math.max(0, Math.min(image.width - size, Math.round(cx - size / 2)));
  const y = Math.max(0, Math.min(image.height - size, Math.round(cy - size / 2)));
  return { x, y, width: size, height: size };
};

interface FramedImgProps extends Omit<ComponentProps<'img'>, 'src'> {
  image: FramedImage;
  size?: number;
  padding?: number;
}

export const FramedImg: FC<FramedImgProps> = ({ image, size = 320, padding = 1.6, ...props }) => (
  <Img
    src={image.url}
    options={{ extract: frame(image.boundingBox, image, padding), width: size, height: size, format: 'webp' }}
    {...props}
  />
);

/** Calls back every `interval` ms while mounted. */
export const useTicker = (interval: number) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(value => value + 1), interval);
    return () => clearInterval(id);
  }, [interval]);
  return tick;
};

interface TickerProps<T> {
  items: T[];
  visible?: number;
  interval?: number;
  render: (item: T) => ReactNode;
  className?: string;
}

/**
 * Continuously cycles through `items`, newest entering at the bottom and the
 * oldest leaving off the top. Runs independently of step navigation.
 */
export const Ticker = <T,>({ items, visible = 3, interval = 2800, render, className }: TickerProps<T>) => {
  const tick = useTicker(interval);
  if (items.length === 0) return null;
  const shown = Array.from({ length: Math.min(visible, items.length) }, (_, index) => tick + index);

  return (
    <div
      className={cn(
        'relative flex w-full flex-col justify-end gap-3 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_22%)]',
        className
      )}
    >
      <AnimatePresence mode="popLayout" initial={true}>
        {shown.map((position, index) => (
          <motion.div
            key={position}
            layout
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40, transition: { duration: 0.2, ease: 'easeIn' } }}
            transition={{ type: 'spring', stiffness: 260, damping: 30, delay: tick === 0 ? 0.3 + index * 0.25 : 0 }}
          >
            {render(items[position % items.length])}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

/** Deterministic pseudo-random number in [0, 1) for a given seed. */
export const random = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

/**
 * The column count and cell size that fit `count` square cells, with `gap`
 * between them, as large as possible inside `width` × `height`.
 */
export const fitGrid = (count: number, width: number, height: number, gap: number) => {
  let columns = 1;
  let size = 0;
  for (let candidate = 1; candidate <= count; candidate++) {
    const rows = Math.ceil(count / candidate);
    const fit = Math.min((width - gap * (candidate - 1)) / candidate, (height - gap * (rows - 1)) / rows);
    if (fit > size) {
      size = fit;
      columns = candidate;
    }
  }
  return { columns, size: Math.floor(size) };
};

export interface StickerSpec {
  src: string;
  /** Position of the sticker's centre within the cluster box, 0–100. */
  x: number;
  y: number;
  /** Width as a percentage of the cluster box. */
  size: number;
  rotate?: number;
  delay?: number;
}

/**
 * A loose pile of stickers that pop in one after another and then bob gently.
 * Fills its box; give it a size.
 */
export const StickerCluster: FC<{ stickers: StickerSpec[]; className?: string }> = ({ stickers, className }) => (
  <div className={cn('relative', className)}>
    {stickers.map((sticker, index) => (
      <motion.div
        key={index}
        // framer-motion owns the transform, so centre with x/y rather than translate classes.
        initial={{ x: '-50%', y: '-50%', opacity: 0, scale: 0.3, rotate: (sticker.rotate ?? 0) - 25 }}
        animate={{ x: '-50%', y: '-50%', opacity: 1, scale: 1, rotate: sticker.rotate ?? 0 }}
        transition={{ delay: 0.25 + (sticker.delay ?? index * 0.12), type: 'spring', stiffness: 240, damping: 14 }}
        style={{ left: `${sticker.x}%`, top: `${sticker.y}%`, width: `${sticker.size}%` }}
        className="absolute"
      >
        <motion.img
          src={sticker.src}
          alt=""
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3.2 + index * 0.4, ease: 'easeInOut', delay: index * 0.3 }}
          className="w-full drop-shadow-lg"
        />
      </motion.div>
    ))}
  </div>
);

interface ConfettiProps {
  /** Seconds before the shower starts. */
  delay?: number;
  pieces?: number;
  className?: string;
}

/** A one-off shower of the site's confetti, contained to its (positioned) parent. */
export const Confetti: FC<ConfettiProps> = ({ delay = 0, pieces = 160, className }) => {
  const [ref, { width, height }] = useMeasure();
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setRunning(true), delay * 1000);
    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <div ref={ref} aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {running && width && height ? (
        <ReactConfetti width={width} height={height} numberOfPieces={pieces} recycle={false} gravity={0.12} />
      ) : null}
    </div>
  );
};
