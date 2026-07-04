import { cn } from '@/utils/cn';
import { ComponentProps, FC, PropsWithChildren } from 'react';
import { GalleryProvider } from './GalleryProvider';

export const Polaroid: FC<PropsWithChildren & ComponentProps<'div'>> = ({ children, className, ...props }) => {
  return (
    <GalleryProvider loop>
      <div
        className={cn(
          'relative aspect-square w-full max-w-m h-fit rounded-md border border-accent border-opacity-50 bg-accent-50 p-6',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </GalleryProvider>
  );
};
