import { Variables } from '@/services/backstage/config';
import { useVariable } from '@alveusgg/backstage';
import * as Sentry from '@sentry/react';
import { ComponentProps, FC, SyntheticEvent } from 'react';
import type { ImgProps, IpxOptions } from './Img';

const fitMap: Record<NonNullable<IpxOptions['fit']>, string> = {
  cover: 'cover',
  contain: 'pad',
  fill: 'squeeze',
  inside: 'scale-down',
  outside: 'cover'
};

const gravityMap: Record<NonNullable<IpxOptions['gravity']>, string> = {
  centre: '0.5x0.5',
  north: 'top',
  east: 'right',
  south: 'bottom',
  west: 'left',
  northeast: 'top',
  southeast: 'right',
  southwest: 'bottom',
  northwest: 'left'
};

const positionMap: Record<NonNullable<IpxOptions['position']>, string> = {
  top: 'top',
  'right top': 'top',
  right: 'right',
  'right bottom': 'right',
  bottom: 'bottom',
  'left bottom': 'bottom',
  left: 'left',
  'left top': 'left'
};

const formatMap: Partial<Record<NonNullable<IpxOptions['format']>, string>> = {
  jpg: 'jpeg',
  jpeg: 'jpeg',
  webp: 'webp',
  avif: 'avif'
};

const option = (key: string, value: string | number) => `${key}=${encodeURIComponent(String(value))}`;

const normaliseSource = (src: string) => {
  if (/^https?:\/\//i.test(src)) return src;
  return src.replace(/^\/+/, '');
};

export const constructCloudflareImageUrl = (options: IpxOptions, src: string, base = '') => {
  const flags: string[] = [];

  if (options.quality) {
    flags.push(option('quality', options.quality));
  }

  const format = options.format && formatMap[options.format];
  if (format) {
    flags.push(option('format', format));
  }

  if (options.position) {
    flags.push(option('gravity', positionMap[options.position]));
  }

  if (options.gravity) {
    flags.push(option('gravity', gravityMap[options.gravity]));
  }

  if (options.blur) {
    flags.push(option('blur', options.blur));
  }

  if (options.extract) {
    flags.push(option('trim.left', options.extract.x));
    flags.push(option('trim.top', options.extract.y));
    flags.push(option('trim.width', options.extract.width));
    flags.push(option('trim.height', options.extract.height));
  }

  if (options.width) {
    flags.push(option('width', options.width));
  }

  if (options.height) {
    flags.push(option('height', options.height));
  }

  if (options.fit) {
    flags.push(option('fit', fitMap[options.fit]));
  } else if (options.width && options.height) {
    flags.push(option('fit', 'cover'));
  }

  if (options.sharpen) {
    flags.push(option('sharpen', options.sharpen));
  }

  const prefix = `${base.replace(/\/$/, '')}/cdn-cgi/image/${flags.join(',')}/`;
  return `${prefix}${normaliseSource(src)}`;
};

const reportCloudflareImageError = (
  event: SyntheticEvent<HTMLImageElement, Event>,
  options: IpxOptions,
  originalSrc: string,
  cloudflareSrc: string
) => {
  const image = event.currentTarget;

  Sentry.startSpan(
    {
      name: 'Cloudflare image load error',
      op: 'resource.img',
      attributes: {
        'image.src': image.currentSrc,
        'cloudflare.original_src': originalSrc,
        'cloudflare.src': cloudflareSrc
      }
    },
    span => {
      span.setStatus({ code: 2, message: 'Cloudflare image failed to load' });

      Sentry.captureException(new Error('Cloudflare image failed to load'), {
        level: 'warning',
        fingerprint: ['cloudflare-image-load-error'],
        tags: {
          subsystem: 'cloudflare-images',
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
          cloudflare: {
            originalSrc,
            options,
            src: cloudflareSrc
          }
        }
      });
    }
  );
};

export const CloudflareImg: FC<ImgProps & ComponentProps<'img'>> = ({ src, options, onError, ...props }) => {
  const cloudflareImageBaseUrl = useVariable<Variables>('cloudflareImageBaseUrl') ?? '';
  if (!src) throw new Error('src is required');

  const cloudflareSrc = constructCloudflareImageUrl(options, src, cloudflareImageBaseUrl);

  return (
    <img
      src={cloudflareSrc}
      onError={event => {
        reportCloudflareImageError(event, options, src, cloudflareSrc);
        onError?.(event);
      }}
      {...props}
    />
  );
};
