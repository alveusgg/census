import { levels } from '@alveusgg/census-levels';

export type CensusLevel = (typeof levels)[keyof typeof levels];

const artworkAvailableInAssets = import.meta.glob('/src/assets/*.outlined.png', {
  query: '?url',
  import: 'default'
});

export const getLevelByNumber = (levelNumber: number) =>
  Object.values(levels).find(level => level.number === levelNumber);

export const hasLevelSticker = (
  level: CensusLevel
): level is CensusLevel & { sticker: { artwork: { name: string } } } => 'sticker' in level;

export const getLevelArtworkAssetPath = (level: CensusLevel) => {
  if (!hasLevelSticker(level)) return null;
  return `/src/assets/${level.sticker.artwork.name}`;
};

export const hasLevelArtworkAsset = (level: CensusLevel) => {
  const artworkPath = getLevelArtworkAssetPath(level);
  return !!artworkPath && artworkPath in artworkAvailableInAssets;
};

export const getLevelArtworkLabel = (level: CensusLevel) => {
  if (!hasLevelSticker(level)) return level.name.toLowerCase();

  return level.sticker.artwork.name.replace(/\.outlined\.png$/, '').replace(/_/g, ' ');
};

export const loadLevelArtwork = async (levelOrNumber: CensusLevel | number) => {
  const level = typeof levelOrNumber === 'number' ? getLevelByNumber(levelOrNumber) : levelOrNumber;

  if (!level) return null;

  const artworkPath = getLevelArtworkAssetPath(level);
  if (!artworkPath || !hasLevelArtworkAsset(level)) return null;

  const imageSrc = await artworkAvailableInAssets[artworkPath]();
  return typeof imageSrc === 'string' ? imageSrc : null;
};

const silhouetteAvailableInAssets = import.meta.glob('/src/assets/*.silhouette.svg', {
  query: '?url',
  import: 'default'
});

export const hasSilhouetteAsset = (path: string) => {
  return path in silhouetteAvailableInAssets;
};

export const loadSilhouette = async (name: string) => {
  const artworkPath = `/src/assets/${name}`;
  if (!hasSilhouetteAsset(artworkPath)) return null;
  const imageSrc = await silhouetteAvailableInAssets[artworkPath]();
  return typeof imageSrc === 'string' ? imageSrc : null;
};
