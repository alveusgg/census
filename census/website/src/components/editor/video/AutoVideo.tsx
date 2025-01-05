import * as Media from '@react-av/core';
import { ComponentProps, FC } from 'react';
import { HLSVideo } from './HLSVideo';

export const AutoVideo: FC<ComponentProps<'video'> & { src: string }> = ({ src, ...props }) => {
  const Component = src.includes('.m3u8') ? HLSVideo : Media.Video;
  return <Component src={src} {...props} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />;
};
