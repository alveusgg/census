import { Button } from '@/components/controls/button/juicy';
import { useWrappedNavigation, Wrapped, WrappedNext, WrappedPrevious, WrappedProgress } from '@/components/wrapped';
import { cn } from '@/utils/cn';
import { useMeasure } from '@uidotdev/usehooks';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Maximize2, Minimize2, Pause, Play, RotateCcw } from 'lucide-react';
import { FC, KeyboardEvent as ReactKeyboardEvent, PropsWithChildren, RefObject, useEffect, useRef, useState } from 'react';
import { CapturesSection } from './Captures';
import { CommentsSection, SuggestionsSection } from './Conversation';
import { CoverSection } from './Cover';
import { PointsSection, ThanksSection } from './Points';
import { Preload } from './Preload';
import { ShiniesSection } from './Shinies';
import { SignupsSection } from './Signups';
import { SpeciesSection } from './Species';

import butterfly from '@/assets/adult_butterfly.outlined.png';
import ladybird from '@/assets/adult_ladybird.outlined.png';
import caterpillar from '@/assets/caterpillar.outlined.png';
import flower from '@/assets/flower.outlined.png';
import toadstool from '@/assets/toadstool.outlined.png';

type Layout = 'landscape' | 'portrait';

/**
 * Every slide is laid out at one of two fixed design sizes and the whole stage
 * is scaled to fit, so proportions are identical at every width and in
 * fullscreen. Below `LANDSCAPE_MIN_WIDTH` the stage switches to the portrait design.
 */
const DESIGN: Record<Layout, { width: number; height: number; maxScale: number }> = {
  landscape: { width: 880, height: 370, maxScale: 1.2 },
  portrait: { width: 360, height: 500, maxScale: 1.2 }
};
const LANDSCAPE_MIN_WIDTH = 720;

/** The season-in-review presentation. */
export const SeasonWrapped: FC = () => {
  const card = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(card);
  const [measureRef, { width, height }] = useMeasure<HTMLDivElement>();

  const layout: Layout = (width ?? LANDSCAPE_MIN_WIDTH) >= LANDSCAPE_MIN_WIDTH ? 'landscape' : 'portrait';
  const design = DESIGN[layout];
  let scale = width ? width / design.width : 1;
  if (fullscreen.active && height) scale = Math.min(scale, height / design.height);
  if (!fullscreen.active) scale = Math.min(scale, design.maxScale);
  const measured = width !== null;

  return (
    <Wrapped dwell={3200}>
      <div
        ref={card}
        data-layout={layout}
        tabIndex={-1}
        className={cn(
          'group/card relative col-span-8 flex flex-col gap-4 overflow-clip rounded-2xl border border-accent border-opacity-50 bg-accent-100 px-5 py-5 leading-snug text-accent-900 outline-none wide:gap-5 wide:px-10 wide:py-6',
          fullscreen.active && 'h-dvh w-screen cursor-default rounded-none border-0 px-6 py-6 wide:px-12 wide:py-8'
        )}
      >
        <Backdrop fullscreen={fullscreen.active} />
        <Preload />

        <Frame fullscreen={fullscreen.active} width={design.width * scale}>
          <WrappedProgress className="h-2.5 gap-2 text-accent-400 wide:h-3 wide:gap-2.5" segmentClassName="rounded-md" />
        </Frame>

        {/* Measures the room available for the stage: width always, height too when filling the screen. */}
        <div
          ref={measureRef}
          className={cn('relative flex w-full justify-center', fullscreen.active && 'min-h-0 flex-1 items-center')}
        >
          <div
            style={{ width: design.width * scale, height: design.height * scale }}
            className={cn('relative transition-opacity duration-300', measured ? 'opacity-100' : 'opacity-0')}
          >
            <div
              style={{ width: design.width, height: design.height, transform: `scale(${scale})` }}
              className="absolute left-0 top-0 origin-top-left overflow-hidden [&>*]:absolute [&>*]:inset-x-4 [&>*]:inset-y-3 wide:[&>*]:inset-x-8 wide:[&>*]:inset-y-6"
            >
              <CoverSection />
              <SignupsSection />
              <CapturesSection />
              <CommentsSection />
              <SuggestionsSection />
              <SpeciesSection />
              <ShiniesSection />
              <PointsSection />
              <ThanksSection />
            </div>
          </div>
        </div>

        <Frame fullscreen={fullscreen.active} width={design.width * scale}>
          <Controls fullscreen={fullscreen} card={card} />
        </Frame>
      </div>
    </Wrapped>
  );
};

/** In fullscreen, keeps the progress bar and controls the same width as the scaled stage. */
const Frame: FC<PropsWithChildren<{ fullscreen: boolean; width: number }>> = ({ fullscreen, width, children }) => (
  <div className="relative flex w-full justify-center">
    <div style={fullscreen ? { width } : undefined} className="w-full max-w-full">
      {children}
    </div>
  </div>
);

const DECOR = [
  { src: butterfly, left: '-2.5%', top: '14%', rotate: -18, size: 'w-20 wide:w-28 [:fullscreen_&]:w-52', duration: 7 },
  { src: flower, left: '91%', top: '70%', rotate: 14, size: 'w-16 wide:w-24 [:fullscreen_&]:w-44', duration: 8.5 },
  { src: ladybird, left: '93%', top: '18%', rotate: 22, size: 'w-12 wide:w-16 [:fullscreen_&]:w-32', duration: 6 },
  { src: toadstool, left: '-1.5%', top: '66%', rotate: -12, size: 'w-14 wide:w-20 [:fullscreen_&]:w-40', duration: 9 },
  { src: caterpillar, left: '26%', top: '91%', rotate: 6, size: 'w-14 wide:w-20 [:fullscreen_&]:w-40', duration: 7.5 }
];

/**
 * A soft spotlight, a faint dot grid that fades towards the middle, and a few
 * washed-out stickers peeking in from the edges and drifting gently.
 */
const Backdrop: FC<{ fullscreen: boolean }> = ({ fullscreen }) => (
  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(97,58,24,0.22)_1px,transparent_1.5px)] bg-[length:22px_22px] opacity-[0.35] [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black_95%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_35%,rgba(255,255,255,0.6),transparent_70%)]" />
    {DECOR.map((item, index) => (
      <motion.img
        key={index}
        src={item.src}
        alt=""
        style={{ left: item.left, top: item.top, rotate: item.rotate }}
        animate={{ y: [0, -8, 0], rotate: [item.rotate, item.rotate + 5, item.rotate] }}
        transition={{ repeat: Infinity, duration: item.duration, ease: 'easeInOut', delay: index * 0.7 }}
        className={cn(
          'absolute saturate-[0.6] [filter:saturate(0.6)_sepia(0.3)]',
          fullscreen ? 'opacity-[0.28]' : 'opacity-[0.22]',
          item.size
        )}
      />
    ))}
  </div>
);

interface FullscreenState {
  active: boolean;
  supported: boolean;
  toggle: () => void;
}

/** Toggles the Fullscreen API on `target` and tracks whether it is currently fullscreen. */
const useFullscreen = (target: RefObject<HTMLElement>): FullscreenState => {
  const [active, setActive] = useState(false);
  const supported = typeof document !== 'undefined' && document.fullscreenEnabled;

  useEffect(() => {
    const onChange = () => setActive(document.fullscreenElement === target.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [target]);

  const toggle = () => {
    if (!target.current) return;
    if (document.fullscreenElement === target.current) {
      void document.exitFullscreen();
    } else {
      void target.current.requestFullscreen();
    }
  };

  return { active, supported, toggle };
};

const Controls: FC<{ fullscreen: FullscreenState; card: RefObject<HTMLDivElement> }> = ({ fullscreen, card }) => {
  const { complete, restart, next, previous, autoplay, setAutoplay, index, total, isLast } = useWrappedNavigation();

  // Presenting fullscreen starts the show rolling; leaving it hands control back.
  useEffect(() => {
    if (fullscreen.active) setAutoplay(true);
    else setAutoplay(false);
  }, [fullscreen.active, setAutoplay]);

  const handleKey = (event: KeyboardEvent | ReactKeyboardEvent) => {
    if (event.key === 'ArrowRight' || event.key === 'Enter') {
      event.preventDefault();
      if (complete) restart();
      else next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      previous();
    } else if (event.key === ' ') {
      event.preventDefault();
      setAutoplay(!autoplay);
    } else if (event.key === 'f' || event.key === 'F') {
      event.preventDefault();
      if (fullscreen.supported) fullscreen.toggle();
    }
  };

  // Fullscreen listens globally; on the page, keys only act while the card has focus.
  useEffect(() => {
    if (!fullscreen.active) return;
    const onKeyDown = (event: KeyboardEvent) => handleKey(event);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  useEffect(() => {
    const element = card.current;
    if (!element || fullscreen.active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select')) return;
      handleKey(event);
    };
    element.addEventListener('keydown', onKeyDown);
    return () => element.removeEventListener('keydown', onKeyDown);
  });

  const playing = autoplay && !complete;

  return (
    <div className="relative flex items-center justify-between gap-3">
      <WrappedPrevious asChild>
        <Button variant="primary" className="px-3.5 wide:px-4" aria-label="Back">
          <ArrowLeft className="size-4" />
          <span className="hidden wide:inline">Back</span>
        </Button>
      </WrappedPrevious>

      <p className="absolute left-1/2 hidden -translate-x-1/2 font-mono text-sm font-bold text-accent-700/80 wide:block">
        {Math.max(index, 0) + 1} / {total}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          className="px-2.5"
          onClick={() => setAutoplay(!playing)}
          data-toggled={playing}
          aria-pressed={playing}
          aria-label={playing ? 'Pause' : 'Play'}
          disabled={complete}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
        {complete ? (
          <Button variant="alveus" className="px-4" onClick={restart}>
            <span>Watch again</span>
            <RotateCcw className="size-4" />
          </Button>
        ) : (
          <WrappedNext asChild>
            <Button variant="alveus" className="px-4">
              <span>{isLast ? 'Finish' : 'Continue'}</span>
              <ArrowRight className="size-4" />
            </Button>
          </WrappedNext>
        )}
        {fullscreen.supported && (
          <Button
            variant="primary"
            className="px-2.5"
            onClick={fullscreen.toggle}
            aria-label={fullscreen.active ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {fullscreen.active ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </Button>
        )}
      </div>
    </div>
  );
};
