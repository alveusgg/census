import { Variables } from '@/services/backstage/config';
import { useVariable } from '@alveusgg/backstage';
import * as Sentry from '@sentry/react';
import { ComponentProps, FC, SyntheticEvent } from 'react';

type Format = 'jpg' | 'jpeg' | 'png' | 'webp' | 'avif' | 'gif' | 'heif' | 'tiff';
type Fit = 'cover' | 'contain' | 'fill' | 'inside' | 'outside';

interface IpxOptions {
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

export const constructIpxUrl = (options: IpxOptions, base: string, src: string) => {
  const flags: string[] = [];

  if (options.quality) {
    flags.push(`quality_${options.quality}`);
  }

  if (options.format) {
    flags.push(`format_${options.format}`);
  }

  if (options.position) {
    flags.push(`position_${options.position}`);
  }

  if (options.gravity) {
    flags.push(`gravity_${options.gravity}`);
  }

  if (options.blur) {
    flags.push(`blur_${options.blur}`);
  }

  if (options.extract) {
    flags.push(`extract_${options.extract.x}_${options.extract.y}_${options.extract.width}_${options.extract.height}`);
  }

  if (options.width || options.height) {
    if (options.width && options.height) {
      flags.push(`s_${options.width}x${options.height}`);
    } else if (options.width) {
      flags.push(`width_${options.width}`);
    } else if (options.height) {
      flags.push(`height_${options.height}`);
    }
  }

  if (options.fit) {
    flags.push(`fit_${options.fit}`);
  }

  if (options.sharpen) {
    flags.push(`sharpen_${options.sharpen}`);
  }

  return `${base}/${flags.join(',')}/${src}`;
};

const reportIpxImageError = (
  event: SyntheticEvent<HTMLImageElement, Event>,
  options: IpxOptions,
  originalSrc: string,
  ipxSrc: string
) => {
  const image = event.currentTarget;

  Sentry.startSpan(
    {
      name: 'IPX image load error',
      op: 'resource.img',
      attributes: {
        'image.src': image.currentSrc,
        'ipx.original_src': originalSrc,
        'ipx.src': ipxSrc
      }
    },
    span => {
      span.setStatus({ code: 2, message: 'IPX image failed to load' });

      Sentry.captureException(new Error('IPX image failed to load'), {
        level: 'warning',
        fingerprint: ['ipx-image-load-error'],
        tags: {
          subsystem: 'ipx',
          action: 'image-load-error'
        },
        contexts: {
          image: {
            alt: image.alt,
            complete: image.complete,
            currentSrc: image.currentSrc,
            naturalHeight: image.naturalHeight,
            naturalWidth: image.naturalWidth,
            renderedHeight: image.height,
            renderedWidth: image.width
          },
          ipx: {
            originalSrc,
            options,
            src: ipxSrc
          }
        }
      });
    }
  );
};

export const Img: FC<ImgProps & ComponentProps<'img'>> = ({ src, options, onError, ...props }) => {
  const ipxBaseUrl = useVariable<Variables>('ipxBaseUrl');
  if (!ipxBaseUrl) throw new Error('ipxBaseUrl is not set');
  if (!src) throw new Error('src is required');

  const ipxSrc = constructIpxUrl(options, ipxBaseUrl, src);

  return (
    <img
      src={ipxSrc}
      onError={event => {
        reportIpxImageError(event, options, src, ipxSrc);
        onError?.(event);
      }}
      {...props}
    />
  );
};
