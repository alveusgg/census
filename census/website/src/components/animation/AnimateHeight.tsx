import { Slot } from '@radix-ui/react-slot';
import { useMeasure } from '@uidotdev/usehooks';
import { motion } from 'framer-motion';
import { ComponentProps, FC } from 'react';

export const AutoAnimatedContainer: FC<ComponentProps<'div'>> = ({ children, ...props }) => {
  const [ref, { height }] = useMeasure();
  return (
    <motion.div
      animate={{ height: height && height > 0 ? height : undefined }}
      transition={{ type: 'spring', bounce: 0, duration: 0.8 }}
      style={{ overflow: 'hidden', position: 'relative' }}
    >
      <Slot ref={ref} {...props}>
        {children}
      </Slot>
    </motion.div>
  );
};
