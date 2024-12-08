import { ComponentProps, FC } from 'react';
import { Img, ImgProps } from './Img';

const make = (extract: { x: number; y: number; width: number; height: number }) => {
  if (extract.height > extract.width) {
    return {
      y: extract.y,
      x: Math.max(0, Math.round(extract.x + (extract.width - extract.height) / 2)),
      height: extract.height,
      width: extract.height
    };
  }

  if (extract.width > extract.height) {
    return {
      x: extract.x,
      y: Math.max(0, Math.round(extract.y + (extract.height - extract.width) / 2)),
      height: extract.width,
      width: extract.width
    };
  }

  return extract;
};

/**
 * A custom version of Img that ensures the image is square.
 */
export const Square: FC<
  (ImgProps & { options: { extract: { x: number; y: number; width: number; height: number } } }) & ComponentProps<'img'>
> = ({ src, options, ...props }) => {
  const extract = make(options.extract);
  return <Img src={src} options={{ ...options, extract }} {...props} />;
};
