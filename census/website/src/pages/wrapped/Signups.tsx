import { Section, Step } from '@/components/wrapped';
import { cn } from '@/utils/cn';
import { useMeasure } from '@uidotdev/usehooks';
import { motion } from 'framer-motion';
import { FC, ReactNode, useEffect, useRef } from 'react';
import { season } from './data';
import { CountUp, Eyebrow, fitGrid, formatNumber, Headline, random, Reveal, Slide, Stat } from './primitives';

const { onboarding } = season;
const percent = (value: number) => Math.round((value / Math.max(onboarding.respondents, 1)) * 100);
const firstTimers = percent(onboarding.firstTimers);
const experienced = percent(onboarding.experienced);

export const SignupsSection: FC = () => (
  <Section wait={2500}>
    <Step>
      <Slide className="wide:gap-8">
        <Stat
          value={<CountUp value={season.signups} duration={1.8} />}
          caption="people signed up to help count the critters in the pollinator garden"
          className="shrink-0 wide:w-[21rem]"
        >
          <Reveal delay={2.2} className="mt-1 text-sm font-semibold text-accent-700">
            every dot is one of them
          </Reveal>
        </Stat>
        <Crowd />
      </Slide>
    </Step>

    <Step wait={3000}>
      <Slide className="wide:gap-10">
        <Waffle />
        <Stat
          className="shrink-0 wide:w-[21rem]"
          value={
            <>
              <CountUp value={firstTimers} duration={1.8} delay={0.5} />%
            </>
          }
          caption="had never taken part in a community science project before"
        >
          <Reveal delay={2} className="mt-2 flex flex-col gap-1 text-sm font-semibold wide:text-base">
            <Legend className="bg-accent-400">{formatNumber(onboarding.firstTimers)} first-timers</Legend>
            <Legend className="bg-accent-700">{formatNumber(onboarding.experienced)} had done it before</Legend>
          </Reveal>
        </Stat>
      </Slide>
    </Step>

    <Step wait={2500}>
      <Slide className="justify-center gap-6 wide:flex-col wide:items-stretch wide:justify-center wide:gap-8">
        <div className="text-center wide:text-left">
          <Reveal>
            <Eyebrow>how they rated their bug skills</Eyebrow>
          </Reveal>
          <Reveal delay={0.1}>
            <Headline className="text-3xl wide:text-5xl">everyone started somewhere</Headline>
          </Reveal>
        </div>
        <SkillBars />
      </Slide>
    </Step>
  </Section>
);

const Legend: FC<{ className: string; children: ReactNode }> = ({ className, children }) => (
  <span className="flex items-center justify-center gap-2 wide:justify-start">
    <span className={cn('size-3.5 rounded', className)} />
    {children}
  </span>
);

const CROWD_GAP = 1.5;
const CROWD_DURATION = 2.4;
const CROWD_DELAY = 0.3;

/** Reads an `--accent-color-*` triplet from the stylesheet so the canvas matches the theme. */
const accent = (shade: number, alpha = 1) => {
  const triplet = getComputedStyle(document.documentElement).getPropertyValue(`--accent-color-${shade}`).trim();
  return `rgba(${triplet.split(/\s+/).join(',')},${alpha})`;
};

/**
 * One dot per person who signed up. Thousands of dots is too many DOM nodes
 * to animate, so they're drawn on a canvas: each pops in at its own moment,
 * in a scattered order, until the whole crowd is there.
 */
const Crowd: FC = () => {
  const [ref, { width, height }] = useMeasure();
  const canvas = useRef<HTMLCanvasElement>(null);
  const count = season.signups;

  useEffect(() => {
    const element = canvas.current;
    if (!element || !width || !height) return;
    const context = element.getContext('2d');
    if (!context) return;

    // Oversample: the stage is scaled with a CSS transform, so the canvas needs headroom to stay crisp.
    const ratio = Math.min(3, (window.devicePixelRatio || 1) * 1.5);
    element.width = Math.round(width * ratio);
    element.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const { columns, size } = fitGrid(count, width, height, CROWD_GAP);
    const rows = Math.ceil(count / columns);
    const offsetX = (width - (columns * size + (columns - 1) * CROWD_GAP)) / 2;
    const offsetY = (height - (rows * size + (rows - 1) * CROWD_GAP)) / 2;
    const radius = size / 2;

    // Seeded shuffle so the dots arrive scattered rather than row by row.
    const order = Array.from({ length: count }, (_, index) => index).sort(
      (a, b) => random(a + 0.37) - random(b + 0.37)
    );
    const appearsAt = new Array<number>(count);
    order.forEach((index, rank) => {
      appearsAt[index] = CROWD_DELAY + (rank / count) * CROWD_DURATION;
    });
    const highlight = Array.from({ length: count }, (_, index) => random(index + 0.71) > 0.86);
    const colours = [accent(400), accent(600)];

    const started = performance.now();
    let frame = 0;
    const draw = (now: number) => {
      const elapsed = (now - started) / 1000;
      context.clearRect(0, 0, width, height);
      let pending = false;
      for (let index = 0; index < count; index++) {
        const age = elapsed - appearsAt[index];
        if (age < 0) {
          pending = true;
          continue;
        }
        // A quick overshoot as each dot lands.
        const t = Math.min(1, age / 0.3) - 1;
        const scale = 1 + 2.7 * t * t * t + 1.7 * t * t;
        const x = offsetX + (index % columns) * (size + CROWD_GAP) + radius;
        const y = offsetY + Math.floor(index / columns) * (size + CROWD_GAP) + radius;
        context.fillStyle = colours[highlight[index] ? 1 : 0];
        context.beginPath();
        context.arc(x, y, Math.max(0, radius * scale), 0, Math.PI * 2);
        context.fill();
      }
      if (pending || elapsed < CROWD_DELAY + CROWD_DURATION + 0.3) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [width, height, count]);

  return (
    <div ref={ref} className="min-h-0 w-full flex-1 wide:h-full wide:self-stretch">
      {width && height ? (
        <canvas ref={canvas} aria-hidden style={{ width, height }} className="block" />
      ) : null}
    </div>
  );
};

const SQUARES = 100;

/** 100 squares, one per 1% of sign-ups, sized to fill whatever box it gets. */
const Waffle: FC = () => {
  const [ref, { width, height }] = useMeasure();
  const gap = 5;
  const { columns, size } = width && height ? fitGrid(SQUARES, width, height, gap) : { columns: 10, size: 0 };

  return (
    <div ref={ref} className="flex min-h-0 w-full flex-1 items-center justify-center wide:h-full wide:self-stretch">
      {size > 0 && (
        <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, ${size}px)`, gap }}>
          {Array.from({ length: SQUARES }, (_, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 + index * 0.012, type: 'spring', stiffness: 420, damping: 22 }}
              style={{ width: size, height: size, borderRadius: Math.max(3, size * 0.22) }}
              className={cn(
                index < firstTimers
                  ? 'bg-accent-400'
                  : index < firstTimers + experienced
                    ? 'bg-accent-700'
                    : 'bg-accent-300'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const skillLabels = ['still learning their bugs', 'beginners who know a few', 'fairly confident', 'bug experts'];
const skillColours = ['bg-accent-300', 'bg-accent-400', 'bg-accent-600', 'bg-accent-800'];

const SkillBars: FC = () => {
  const total = Math.max(
    onboarding.skillLevels.reduce((sum, level) => sum + level, 0),
    1
  );
  const max = Math.max(...onboarding.skillLevels) / total;

  return (
    <div className="flex w-full flex-col gap-2.5 wide:gap-3">
      {onboarding.skillLevels.map((level, index) => {
        const share = level / total;
        const delay = 0.4 + index * 0.15;
        return (
          <div key={index} className="grid grid-cols-[7.5rem_1fr] items-center gap-3 wide:grid-cols-[16rem_1fr] wide:gap-4">
            <Reveal delay={delay} className="text-right text-sm font-bold leading-tight wide:text-lg">
              {skillLabels[index]}
            </Reveal>
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${(share / max) * 82}%` }}
                transition={{ delay, type: 'spring', stiffness: 120, damping: 16 }}
                className={cn('h-8 min-w-2 rounded-lg wide:h-11', skillColours[index])}
              />
              <Reveal delay={delay + 0.4} className="font-mono text-base font-bold wide:text-lg">
                {Math.round(share * 100)}%
              </Reveal>
            </div>
          </div>
        );
      })}
    </div>
  );
};
