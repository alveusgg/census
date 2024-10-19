import { Note } from '@/components/containers/Note';
import { Timestamp } from '@/components/text/Timestamp';
import { useCapture } from '@/services/api/capture';
import * as Media from '@react-av/core';
import { FC } from 'react';
import { Dock } from '../../components/controls/Dock';
import { CaptureProps } from './Capture';

export const ReadOnly: FC<CaptureProps> = ({ id }) => {
  const snapshot = useCapture(id);

  return (
    <div className="flex-1 bg-accent-100 p-8 flex flex-col gap-6 items-center">
      <nav className="w-full relative flex items-center justify-end">
        <Note className="w-fit z-10 absolute top-0 left-0 rounded-md min-w-96">
          <p className="px-3 py-1 text-sm">
            Captured by <strong>{snapshot.data.capturedBy}</strong>
          </p>
          <p className="px-3 py-1 text-sm">
            Captured at{' '}
            <strong>
              <Timestamp date={new Date(snapshot.data.capturedAt)} />
            </strong>
          </p>
        </Note>
      </nav>
      <div className="w-full relative flex-1">
        <div className="h-full flex items-center justify-center">
          <Media.Root>
            <Media.Container>
              {snapshot.data.videoUrl && (
                <Media.Video
                  src={snapshot.data.videoUrl}
                  onPointerEnterCapture={() => {}}
                  onPointerLeaveCapture={() => {}}
                />
              )}
            </Media.Container>
            <Media.Viewport>
              <p>Hello</p>
            </Media.Viewport>
          </Media.Root>
        </div>
      </div>
      <Dock>
        {/* <DockKeyNavigator length={300} index={index} setIndex={setIndex} /> */}
        {/* {snapshot.data.images.map((image, i) => {
          return (
            <Suspense key={image} fallback={null}>
              <Thumbnail url={image} selected={index === i} onClick={() => setIndex(i)} />
            </Suspense>
          );
        })} */}
      </Dock>
    </div>
  );
};
