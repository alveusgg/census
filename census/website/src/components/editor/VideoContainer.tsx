import * as Media from '@react-av/core';
import { useMeasure } from '@uidotdev/usehooks';
import { FC, PropsWithChildren } from 'react';

const VIDEO_ASPECT_RATIO = 16 / 9;

export const VideoContainer: FC<PropsWithChildren> = ({ children }) => {
  const [ref, { height, width }] = useMeasure();
  const availableHeight = height ?? 0;
  const availableWidth = width ?? 0;
  const videoWidth = Math.min(availableWidth, availableHeight * VIDEO_ASPECT_RATIO);
  const videoHeight = videoWidth / VIDEO_ASPECT_RATIO;

  return (
    <div className="relative min-h-0 w-full flex-1">
      <div className="absolute inset-0 p-2">
        <div ref={ref} className="flex h-full w-full items-center justify-center">
          <Media.Container style={{ height: videoHeight, width: videoWidth }} className="relative shrink-0 bg-black">
            {children}
          </Media.Container>
        </div>
      </div>
    </div>
  );
};
