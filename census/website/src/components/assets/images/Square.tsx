import { ComponentProps, FC } from 'react';
import { Img, ImgProps } from './Img';

const make = (
  extract: { x: number; y: number; width: number; height: number },
  image: { width: number; height: number }
) => {
  const size = Math.min(Math.max(extract.width, extract.height), image.width, image.height);
  const cx = extract.x + extract.width / 2;
  const cy = extract.y + extract.height / 2;
  const x = Math.max(0, Math.min(image.width - size, Math.round(cx - size / 2)));
  const y = Math.max(0, Math.min(image.height - size, Math.round(cy - size / 2)));
  return { x, y, width: size, height: size };
};

/**
 * A custom version of Img that ensures the image is square.
 */
export const Square: FC<
  ImgProps & {
    image: { width: number; height: number };
    options: { extract: { x: number; y: number; width: number; height: number } };
  } & ComponentProps<'img'>
> = ({ src, image, options, ...props }) => {
  const extract = make(options.extract, image);
  return <Img src={src} options={{ ...options, extract }} {...props} />;
};
