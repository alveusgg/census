import SiChevronLeft from '@/components/icons/SiChevronLeft';
import SiChevronRight from '@/components/icons/SiChevronRight';
import { cn } from '@/utils/cn';
import { ComponentProps, FC, PropsWithChildren } from 'react';
import { useGallery } from './hooks';

interface SlideButtonProps {
  direction: 'next' | 'previous';
}

export const SlideButton: FC<PropsWithChildren<SlideButtonProps & ComponentProps<'button'>>> = ({
  direction,
  children,
  ...props
}) => {
  const [next, previous] = useGallery(state => [state.next, state.previous]);
  return (
    <button {...props} onClick={() => (direction === 'next' ? next() : previous())}>
      {children}
    </button>
  );
};

export const Controls: FC = () => {
  const { slides, current, goto } = useGallery(state => state);
  if (slides.length <= 1) return null;
  return (
    <>
      <SlideButton
        direction="previous"
        className="absolute top-1/2 -translate-y-1/2 -left-2 z-10 bg-white border border-accent border-opacity-50 text-accent-darker p-1 rounded-full shadow-xl cursor-pointer"
      >
        <SiChevronLeft className="text-3xl" />
      </SlideButton>
      <SlideButton
        direction="next"
        className="absolute top-1/2 -translate-y-1/2 -right-2 z-10 bg-white border border-accent border-opacity-50 text-accent-darker p-1 rounded-full shadow-xl cursor-pointer"
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
