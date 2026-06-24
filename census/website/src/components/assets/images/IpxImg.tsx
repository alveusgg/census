import { Variables } from '@/services/backstage/config';
import { useVariable } from '@alveusgg/backstage';
import * as Sentry from '@sentry/react';
import { ComponentProps, FC, SyntheticEvent } from 'react';
import type { ImgProps, IpxOptions } from './Img';

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

export const IpxImg: FC<ImgProps & ComponentProps<'img'>> = ({ src, options, onError, ...props }) => {
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
