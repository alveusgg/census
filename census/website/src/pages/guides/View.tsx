import { FC } from 'react';
import { Tldraw } from 'tldraw';

import { Header } from '@/layouts/Header';
import { useAPI } from '@/services/query/hooks';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import 'tldraw/tldraw.css';
import { Background, ContentMask, MenuPanel } from './helpers/Canvas';
import { assetUrls, bootstrapEditor, CAMERA_OPTIONS, convertRoomSnapshotToStoreSnapshot } from './helpers/utils';

export const View: FC = () => {
  const { slug } = useParams();
  if (!slug) {
    throw new Error('No id');
  }

  const api = useAPI();
  const result = useSuspenseQuery({
    queryKey: ['guides', slug],
    queryFn: async () => {
      const guide = await api.guides.guide.getBySlug.query({ slug });
      if (!guide.draft.content) {
        return [guide] as const;
      }

      return [guide, convertRoomSnapshotToStoreSnapshot(guide.draft.content)] as const;
    }
  });
  const [, snapshot] = result.data;

  return (
    <div className="h-full w-full flex flex-col">
      <Header />
      <div className="flex-1 relative">
        <div className="absolute bg-accent-100 rounded-md overflow-clip inset-0 z-0">
          <Tldraw
            snapshot={snapshot}
            forceMobile
            options={{ maxPages: 1 }}
            components={{
              Background: () => <Background mode="view" />,
              SharePanel: () => (
                <div
                  className="px-6 flex items-center gap-2 py-3 pointer-events-auto"
                  style={{
                    '--color-low': 'rgb(249 242 215)',
                    '--color-background': 'rgb(249 242 215)'
                  }}
                ></div>
              ),
              InFrontOfTheCanvas: () => <ContentMask mode="view" />,
              MenuPanel: MenuPanel
            }}
            cameraOptions={CAMERA_OPTIONS}
            onMount={editor => {
              editor.updateInstanceState({ isReadonly: true });
              bootstrapEditor(editor);
            }}
            assetUrls={assetUrls}
          />
        </div>
      </div>
    </div>
  );
};
