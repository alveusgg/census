import { cn } from '@/utils/cn';
import * as Media from '@react-av/core';
import { format } from 'date-fns';
import { HTMLMotionProps, motion } from 'framer-motion';
import { FC, HTMLAttributes } from 'react';
export const Tick: FC<HTMLMotionProps<'span'>> = ({ className, ...props }) => {
  return (
    <motion.span
      initial={{ height: '0.5rem' }}
      animate={{ height: '1rem' }}
      className={cn('w-[2px] bg-accent-900 bg-opacity-45', className)}
      {...props}
    ></motion.span>
  );
};

export const SubTick: FC<HTMLMotionProps<'span'>> = ({ className, ...props }) => {
  return (
    <motion.span
      style={{ height: '0.5rem' }}
      className={cn('w-[2px] bg-accent-900 bg-opacity-45', className)}
      {...props}
    ></motion.span>
  );
};

interface SecondProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The start time of the second, i.e. 00:00 - 00:01 would be 0.
   */
  second: number;
}

const ZeroWidthSpace = '\u200B';

/*
  This component is used to display a second in the timeline.
  It is used to display the time of the second and the tick marks.
  It uses the container query to determine the screen size and the visibility of the tick marks and the time.

  The time is displayed in the format mm:ss.
  If the second is the start of the end, always show it.
*/
export const Second: FC<SecondProps> = ({ second }) => {
  const duration = Media.useMediaDuration();
  const proportion = second / duration;
  return (
    <div className="@container">
      <div className="flex items-center gap-2 relative">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: proportion * 0.2 }}
          className={cn('text-xs font-medium text-accent-900', second % 5 !== 0 && 'hidden')}
        >
          {format(new Date(new Date().setMinutes(Math.floor(second / 60))).setSeconds(second % 60), 'mm:ss')}
        </motion.p>
        <p>{ZeroWidthSpace}</p>
      </div>

      <div className="grid grid-flow-col h-4">
        <Tick transition={{ delay: proportion * 0.2 }} />
        <SubTick transition={{ delay: proportion * 0.2 }} className="hidden @[20px]:block" />
        <SubTick transition={{ delay: proportion * 0.2 }} className="hidden @[10px]:block" />
      </div>
    </div>
  );
};
