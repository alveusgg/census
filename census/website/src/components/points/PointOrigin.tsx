import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';
import { ComponentProps, FC, PropsWithChildren, RefObject } from 'react';

export interface PointOriginProps {
  id: string;
  bubbleRef: RefObject<HTMLDivElement>;
  textRef: RefObject<HTMLSpanElement>;
}

export const PointOrigin: FC<PropsWithChildren<PointOriginProps & ComponentProps<'div'>>> = ({
  children,
  id,
  bubbleRef,
  textRef,
  className,
  ...props
}) => {
  return (
    <div className={cn('relative w-fit', className)} {...props}>
      {children}
      <div className="w-full absolute inset-0 pointer-events-none">
        <motion.div
          layoutScroll
          className={cn(
            'text-white min-w-12 mx-auto relative bg-[#B877F9] w-fit px-3 py-1 rounded-full font-bold flex justify-center items-center',
            'shadow-[inset_0_-1px_6px_4px_rgba(0,0,0,0.08)]'
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0 }}
          layout="position"
          layoutId={`point-origin-${id}`}
          ref={bubbleRef}
        >
          <p className="font-mono">
            <span className="font-medium text-sm">+</span>
            <span ref={textRef}>0</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
