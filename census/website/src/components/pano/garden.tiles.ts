import type { PanoTileManifest } from './lib/PanoMapManager';

export const gardenPanoManifest: PanoTileManifest = {
  projection: 'equirectangular',
  base: {
    src: '/pano/garden/base.webp',
    width: 4096,
    height: 2048
  },
  levels: [
    {
      id: 'medium',
      width: 12120,
      height: 6060,
      tileWidth: 1024,
      tileHeight: 1024,
      showBelowFov: 32,
      columns: 12,
      rows: 6,
      urlTemplate: '/pano/garden/{z}/{y}/{x}.webp'
    },
    {
      id: 'high',
      width: 24240,
      height: 12120,
      tileWidth: 1024,
      tileHeight: 1024,
      showBelowFov: 16,
      columns: 24,
      rows: 12,
      urlTemplate: '/pano/garden/{z}/{y}/{x}.webp'
    }
  ]
};
