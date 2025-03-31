import { cn } from '@/utils/cn';
import { HTMLMotionProps, motion } from 'framer-motion';
import { FC, PropsWithChildren } from 'react';
import { Leaf } from './Leaf';

interface BadgeProps {
  variant: 'bronze' | 'silver' | 'gold';
}

const fillForVariant = {
  bronze: '#FFAB52',
  silver: '#ECECEC',
  gold: 'url(#gradient)'
};

const sizeForVariant = {
  bronze: 20,
  silver: 22,
  gold: 26
};

export const Badge: FC<PropsWithChildren<BadgeProps & HTMLMotionProps<'div'>>> = ({
  children,
  variant,
  className,
  transition,
  ...props
}) => {
  const delay = transition?.delay ?? 0;
  return (
    <motion.div className={cn('flex items-center -space-x-2', className)} {...props}>
      <motion.span
        transition={{ delay: 0.1 + delay }}
        initial={{ y: 10, opacity: 0, zIndex: 1 }}
        animate={{ y: 0, opacity: 1, zIndex: 1 }}
      >
        <Leaf width={sizeForVariant[variant]} fill={fillForVariant[variant]} />
      </motion.span>
      <motion.span
        transition={{ delay }}
        initial={{ y: 10, opacity: 0, zIndex: 2 }}
        animate={{ y: 0, opacity: 1, zIndex: 2 }}
      >
        {children}
      </motion.span>
      <motion.span
        transition={{ delay: 0.1 + delay }}
        initial={{ y: 10, opacity: 0, zIndex: 1 }}
        animate={{ y: 0, opacity: 1, zIndex: 1 }}
      >
        <Leaf className="-scale-x-100" width={sizeForVariant[variant]} fill={fillForVariant[variant]} />
      </motion.span>
    </motion.div>
  );
};
