import { useFlag } from '@alveusgg/backstage';
import { ComponentProps, FC } from 'react';
import { CloudflareImg } from './CloudflareImg';
import { IpxImg } from './IpxImg';

type Format = 'jpg' | 'jpeg' | 'png' | 'webp' | 'avif' | 'gif' | 'heif' | 'tiff';
type Fit = 'cover' | 'contain' | 'fill' | 'inside' | 'outside';

export interface IpxOptions {
  width?: number;
  height?: number;
  extract?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  /**
   * 0-100
   */
  quality?: number;
  format?: Format;
  position?: 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top';
  gravity?: 'centre' | 'north' | 'east' | 'south' | 'west' | 'northeast' | 'southeast' | 'southwest' | 'northwest';
  sharpen?: number;

  /**
   * cover: (default) Preserving aspect ratio, attempt to ensure the image covers both provided dimensions by cropping/clipping to fit.
   *
   * contain: Preserving aspect ratio, contain within both provided dimensions using "letterboxing" where necessary.
   *
   * fill: Ignore the aspect ratio of the input and stretch to both provided dimensions.
   *
   * inside: Preserving aspect ratio, resize the image to be as large as possible while ensuring its dimensions are less than or equal to both those specified.
   *
   * outside: Preserving aspect ratio, resize the image to be as small as possible while ensuring its dimensions are greater than or equal to both those specified.
   *
   * @link https://sharp.pixelplumbing.com/api-resize#resize
   */
  fit?: Fit;

  blur?: number;
}

export interface ImgProps {
  options: IpxOptions;
}

export const Img: FC<ImgProps & ComponentProps<'img'>> = props => {
  const useCloudflareImages = useFlag('cloudflareImages');
  return useCloudflareImages ? <CloudflareImg {...props} /> : <IpxImg {...props} />;
};
