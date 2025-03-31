import { cn } from '@/utils/cn';
import { useMeasure } from '@uidotdev/usehooks';
import { HTMLMotionProps, motion } from 'framer-motion';
import { FC, PropsWithChildren, ReactNode } from 'react';

interface PodiumProps {
  badge: ReactNode;
}

export const Podium: FC<PropsWithChildren<PodiumProps & HTMLMotionProps<'div'>>> = ({
  children,
  badge,
  className,
  transition,
  ...props
}) => {
  const delay = transition?.delay ?? 0;
  const [ref, { height }] = useMeasure();
  return (
    <div className={cn('mt-8 flex flex-col justify-end', className)} style={{ height: height ?? 0 }}>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: height ?? 0, opacity: 1 }}
        className="bg-[#A356F0] h-fit w-full relative border shadow-inner border-[#8D40DB] rounded-xl z-20 text-center text-white font-bold text-2xl font-mono"
        transition={{ delay, type: 'spring', stiffness: 120, damping: 10 }}
        {...props}
      >
        <div ref={ref} className="pb-3 pt-6 px-3 @xl:px-6">
          {badge}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + delay }}
          >
            {children}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
