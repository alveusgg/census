import { Square } from '@/components/assets/images/Square';
import { Breadcrumbs } from '@/layouts/Breadcrumbs';
import { useCapture } from '@/services/api/capture';
import { FC } from 'react';
import { CaptureProps } from './Capture';

export const ReadOnly: FC<CaptureProps> = ({ id }) => {
  const capture = useCapture(id);

  return (
    <div className="flex-1 bg-accent-100 text-alveus-darker p-8 flex flex-col gap-6 items-center">
      <Breadcrumbs>
        <p>home</p>
        <span>•</span>
        <p className="text-lg">captures</p>
      </Breadcrumbs>
      <h1 className="text-2xl font-bold">Saved!</h1>
      {capture.data.observations.map(observation => (
        <div key={observation.id} className="flex gap-2">
          {observation.images.map(image => (
            <Square
              key={image.id}
              className="w-64 h-64"
              src={image.url}
              options={{
                extract: image.boundingBox
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
