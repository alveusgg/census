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
  const { slides, current, goto } = useGallery(state => state);
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
        className="absolute z-10 bg-white border border-accent border-opacity-50 text-accent-darker p-1 rounded-full shadow-xl cursor-pointer"
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
        className="absolute z-10 bg-white border border-accent border-opacity-50 text-accent-darker p-1 rounded-full shadow-xl cursor-pointer"
      >
        <SiChevronRight className="text-3xl" />
      </SlideButton>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-0.5 z-40">
        {slides.map(slide => (
          <button
            aria-label={`Jump to slide ${slide}`}
            onClick={() => goto(slide)}
            key={slide}
            className={cn(
              'w-2 h-2 rounded-full bg-white border border-black opacity-50',
              current === slide && 'opacity-100'
            )}
          />
        ))}
      </div>
    </>
  );
};
