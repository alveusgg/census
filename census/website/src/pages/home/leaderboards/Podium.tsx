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
    <div className={cn('mt-6 flex min-w-0 flex-col justify-end', className)} style={{ height: height ?? 0 }}>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: height ?? 0, opacity: 1 }}
        className="relative z-20 h-fit w-full rounded-lg border border-leaderboard-700 bg-leaderboard-600 text-center font-mono text-2xl font-bold text-white shadow-inner"
        transition={{ delay, type: 'spring', stiffness: 120, damping: 10 }}
        {...props}
      >
        <div ref={ref} className="px-3 pb-3 pt-6 @xl:px-5">
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
