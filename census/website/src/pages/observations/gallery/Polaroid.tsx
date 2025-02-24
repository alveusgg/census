import { cn } from '@/lib/utils';
import { ComponentProps, FC, PropsWithChildren } from 'react';
import { GalleryProvider } from './GalleryProvider';

export const Polaroid: FC<PropsWithChildren & ComponentProps<'div'>> = ({ children, className, ...props }) => {
  return (
    <GalleryProvider loop>
      <div
        className={cn(
          'relative aspect-square w-full max-w-m h-fit p-6 bg-white border border-accent border-opacity-50 rounded-md',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </GalleryProvider>
  );
};
