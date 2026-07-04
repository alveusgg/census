import SiChevronLeft from '@/components/icons/SiChevronLeft';
import SiChevronRight from '@/components/icons/SiChevronRight';
import { cn } from '@/utils/cn';
import { animate, HTMLMotionProps, motion } from 'framer-motion';
import { FC, PropsWithChildren, useRef } from 'react';
import { useGallery } from './hooks';

interface SlideButtonProps {
  direction: 'next' | 'previous';
}

export const SlideButton: FC<PropsWithChildren<SlideButtonProps & HTMLMotionProps<'button'>>> = ({
  direction,
  children,
  ...props
}) => {
  const [next, previous] = useGallery(state => [state.next, state.previous]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  return (
    <motion.button
      ref={buttonRef}
      {...props}
      onClick={() => {
        direction === 'next' ? next() : previous();
        if (!buttonRef.current) return;
        animate([
          [buttonRef.current, { x: direction === 'next' ? 5 : -5 }, { duration: 0.1 }],
          [buttonRef.current, { x: 0 }, { duration: 0.1 }]
        ]);
      }}
    >
      {children}
    </motion.button>
  );
};

export const ClickToMove: FC = () => {
  const [next] = useGallery(state => [state.next, state.previous]);
  return <button className="absolute inset-0 z-10" onClick={() => next()} />;
};

export const Controls: FC = () => {
  const { slides } = useGallery(state => state);
  if (slides.length <= 1) return null;
  return (
    <>
      <SlideButton
        direction="previous"
        style={{
          top: '50%',
          left: '-0.5rem',
          y: '-50%'
        }}
        className="absolute z-10 cursor-pointer rounded-full border border-accent border-opacity-50 bg-accent-50 p-1 text-accent-900 shadow-xl"
      >
        <SiChevronLeft className="text-3xl" />
      </SlideButton>
      <SlideButton
        direction="next"
        style={{
          top: '50%',
          right: '-0.5rem',
          y: '-50%'
        }}
        className="absolute z-10 cursor-pointer rounded-full border border-accent border-opacity-50 bg-accent-50 p-1 text-accent-900 shadow-xl"
      >
        <SiChevronRight className="text-3xl" />
      </SlideButton>
    </>
  );
};

export const SlidePips: FC<{ className?: string }> = ({ className }) => {
  const { slides, current, goto } = useGallery(state => state);
  if (slides.length <= 1) return null;

  return (
    <div className={cn('absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-0.5 z-40', className)}>
      {slides.map(slide => (
        <button
          aria-label={`Jump to slide ${slide}`}
          type="button"
          onClick={e => {
            e.preventDefault();
            goto(slide);
          }}
          key={slide}
          className={cn(
            'h-2 w-2 rounded-full border border-accent-950/50 bg-accent-50 opacity-50',
            current === slide && 'opacity-100'
          )}
        />
      ))}
    </div>
  );
};
