import { cn } from '@/utils/cn';
import * as Media from '@react-av/core';
import { useMeasure } from '@uidotdev/usehooks';
import { FC, PropsWithChildren } from 'react';

export const VideoContainer: FC<PropsWithChildren> = ({ children }) => {
  const [ref, { height, width }] = useMeasure();

  return (
    <div className="w-full relative flex-1" ref={ref}>
      <div
        style={{ height: height ?? 0 }}
        className={cn('h-full flex flex-col gap-4 justify-center items-center absolute inset-0 px-2')}
      >
        <Media.Container
          style={{ maxHeight: height ?? 0, maxWidth: width ?? 0 }}
          className={cn('relative', width && height && width * 0.56 > height ? 'h-full' : 'w-full')}
        >
          {children}
        </Media.Container>
      </div>
    </div>
  );
};
