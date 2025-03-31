import { useAPI } from '@/services/query/hooks';
import { useMutation } from '@tanstack/react-query';
import { AssetRecordType, getHashForString, TLBookmarkAsset } from 'tldraw';

export const useUnfurl = () => {
  const api = useAPI();
  return useMutation({
    mutationFn: async ({ url }: { url: string }): Promise<TLBookmarkAsset> => {
      const asset: TLBookmarkAsset = {
        id: AssetRecordType.createId(getHashForString(url)),
        typeName: 'asset',
        type: 'bookmark',
        meta: {},
        props: {
          src: url,
          description: '',
          image: '',
          favicon: '',
          title: ''
        }
      };

      try {
        const data = await api.guides.utils.unfurl.query({ url });

        asset.props.description = data?.description ?? '';
        asset.props.image = data?.image ?? '';
        asset.props.favicon = data?.favicon ?? '';
        asset.props.title = data?.title ?? '';
      } catch (e) {
        console.error(e);
      }

      return asset;
    }
  });
};
