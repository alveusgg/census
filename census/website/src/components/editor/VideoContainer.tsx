import { cn } from '@/utils/cn';
import * as Media from '@react-av/core';
import { useMeasure } from '@uidotdev/usehooks';
import { FC, PropsWithChildren } from 'react';

const VIDEO_ASPECT_RATIO = 16 / 9;

export const VideoContainer: FC<PropsWithChildren> = ({ children }) => {
  const [ref, { height, width }] = useMeasure<HTMLDivElement>();

  const availableWidth = Math.max(width ?? 0, 0);
  const availableHeight = Math.max(height ?? 0, 0);
  const mediaWidth = Math.floor(Math.min(availableWidth, availableHeight * VIDEO_ASPECT_RATIO));
  const mediaHeight = Math.floor(mediaWidth / VIDEO_ASPECT_RATIO);
  const hasMeasuredSize = mediaWidth > 0 && mediaHeight > 0;

  return (
    <div className="grid h-full min-h-0 w-full place-items-center" ref={ref}>
      <Media.Container
        style={{ width: mediaWidth, height: mediaHeight }}
        className={cn('relative max-w-full', !hasMeasuredSize && 'opacity-0')}
      >
        {children}
      </Media.Container>
    </div>
  );
};
