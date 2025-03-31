import { useSync } from '@tldraw/sync';
import { FC, useCallback } from 'react';
import { Tldraw, useTldrawUser } from 'tldraw';

import SiDataTransferCheck from '@/components/icons/SiDataTransferCheck';
import { Header } from '@/layouts/Header';
import { useRequestToken, useUser } from '@/services/authentication/hooks';
import { useAPI } from '@/services/query/hooks';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import 'tldraw/tldraw.css';
import { Button } from '../../components/controls/button/juicy';
import { useAssetStore } from './helpers/assets';
import { Background, ContentMask, MenuPanel } from './helpers/Canvas';
import { useUnfurl } from './helpers/hooks';
import { assetUrls, bootstrapEditor, CAMERA_OPTIONS } from './helpers/utils';

const usePublish = () => {
  const api = useAPI();
  return useMutation({
    mutationFn: async (id: string) => api.guides.guide.publish.mutate({ id })
  });
};

export const Edit: FC = () => {
  const user = useUser();
  const requestToken = useRequestToken();

  const { slug } = useParams();
  if (!slug) {
    throw new Error('No id');
  }

  const api = useAPI();
  const assets = useAssetStore();
  const guide = useSuspenseQuery({
    queryKey: ['guides', slug],
    queryFn: () => api.guides.guide.getBySlug.query({ slug })
  });

  const uri = useCallback(async () => {
    const token = await requestToken();
    return `http://localhost:5172/connect/${guide.data.draft.id}?accessToken=${token}`;
  }, [guide.data.draft.id, requestToken]);

  const store = useSync({
    uri,
    assets,

    userInfo: {
      id: `user-${user.twitchUserId}-${crypto.randomUUID()}`,
      name: user.twitchUsername
    }
  });

  const tldrawUser = useTldrawUser({
    userPreferences: {
      id: `user-${user.twitchUserId}-${crypto.randomUUID()}`,
      name: user.twitchUsername
    }
  });

  const navigate = useNavigate();
  const publish = usePublish();
  const unfurl = useUnfurl();

  return (
    <div className="h-full w-full flex flex-col">
      <Header />
      <div className="flex-1 relative">
        <div className="absolute bg-accent-100 rounded-md overflow-clip inset-0 z-0">
          <Tldraw
            store={store}
            user={tldrawUser}
            forceMobile
            options={{ maxPages: 1 }}
            components={{
              Background: () => <Background mode="edit" />,
              SharePanel: () => (
                <div
                  className="px-6 flex items-center gap-2 py-3 pointer-events-auto"
                  style={{
                    '--color-low': 'rgb(249 242 215)',
                    '--color-background': 'rgb(249 242 215)'
                  }}
                >
                  <Button
                    loading={publish.isPending}
                    onClick={async () => {
                      await publish.mutateAsync(guide.data.id);
                      navigate(`/guides/${guide.data.slug}`);
                    }}
                  >
                    <SiDataTransferCheck className="text-xl" />
                    Publish
                  </Button>
                </div>
              ),
              InFrontOfTheCanvas: () => <ContentMask mode="edit" />,
              MenuPanel: MenuPanel
            }}
            cameraOptions={CAMERA_OPTIONS}
            onMount={editor => {
              bootstrapEditor(editor);
              editor.registerExternalAssetHandler('url', async info => {
                return unfurl.mutateAsync({ url: info.url });
              });
            }}
            assetUrls={assetUrls}
          />
        </div>
      </div>
    </div>
  );
};
