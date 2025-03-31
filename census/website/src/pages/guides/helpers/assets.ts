import { useMemo } from 'react';
import { TLAssetStore } from 'tldraw';

export const useAssetStore = (): TLAssetStore => {
  // to upload an asset, we prefix it with a unique id, POST it to our worker, and return the URL
  return useMemo(
    () => ({
      async upload(_asset, _) {
        return {
          src: 'https://media.discordapp.net/attachments/1336911044228022362/1352132455494058057/image.png?ex=67e2d5ba&is=67e1843a&hm=47f8d66ab96491f16c4b9b41084af1600fbafc3192947b995aa06715c0a76545&=&format=webp&quality=lossless&width=1518&height=1146',
          meta: {}
        };
      },
      // to retrieve an asset, we can just use the same URL. you could customize this to add extra
      // auth, or to serve optimized versions / sizes of the asset.
      resolve(asset) {
        return asset.props.src;
      }
    }),
    []
  );
};
