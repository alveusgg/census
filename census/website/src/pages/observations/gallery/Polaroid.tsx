import { FC, PropsWithChildren } from 'react';
import { Controls } from './Controls';
import { GalleryProvider } from './GalleryProvider';

export const Polaroid: FC<PropsWithChildren> = ({ children }) => {
  return (
    <GalleryProvider loop>
      <div className="relative aspect-square w-full max-w-m h-fit d p-6 bg-white border border-accent border-opacity-50 rounded-md">
        {children}
        <Controls />
      </div>
    </GalleryProvider>
  );
};
