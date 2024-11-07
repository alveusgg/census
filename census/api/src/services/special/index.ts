import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { useEnvironment } from '../../utils/env/env';

interface Shiny {
  iNatId: number;
  name: string;
  image: string;
}

interface Season {
  meta: {
    root: string;
  };

  season: number;
  from: string;
  to: string;

  shinys: Shiny[];
}

export const getSeasonForCurrentDate = async () => {
  const seasons = await getSeasons();
  return seasons.find(s => {
    const from = new Date(s.from);
    const to = new Date(s.to);
    return from <= new Date() && to >= new Date();
  });
};

export const getSeasons = async () => {
  const { variables } = useEnvironment();
  const seasons = await readdir(variables.ASSETS_PATH);
  if (!seasons.length) {
    throw new Error('No seasons found');
  }

  return Promise.all(
    seasons.map(async path => {
      const root = join(cwd(), variables.ASSETS_PATH, path, 'shiny');

      // Check for unencrypted folder
      if (await isUnzipped(root)) {
        return parseSeason(root);
      }

      await unzip(root);
      return parseSeason(root);
    })
  );
};

export const parseSeason = async (root: string) => {
  const local = await readFile(join(root, 'index.json'), 'utf8');
  const season = JSON.parse(local) as Omit<Season, 'meta'>;
  return {
    ...season,
    meta: { root }
  };
};

export const isUnzipped = async (root: string) => {
  const { variables } = useEnvironment();
  if (variables.NODE_ENV !== 'development') {
    // Should never happen in production
    return false;
  }

  try {
    const folder = await stat(root);
    return folder.isDirectory();
  } catch (error) {
    return false;
  }
};

export const unzip = async (root: string) => {
  console.log('Unzipping', root);
};
