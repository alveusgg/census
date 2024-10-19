import { useVariable } from '@alveusgg/backstage';
import { FC, PropsWithChildren } from 'react';

export const Main: FC<PropsWithChildren<{ url: string }>> = ({ url, children }) => {
  const imageResizeCDNUrl = useVariable('imageResizeCDNUrl');

  return (
    <div className="max-w-full max-h-full h-full aspect-video border-[5px] bg-neutral-600 rounded-lg border-accent-300 relative">
      {children}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${imageResizeCDNUrl}/width=100,blur=10/${url})`,
          backfaceVisibility: 'hidden'
        }}
      />
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${imageResizeCDNUrl}/quality=85/${url})`,
          backfaceVisibility: 'hidden'
        }}
      />
    </div>
  );
};
