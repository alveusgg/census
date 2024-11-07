import { levels } from '@alveusgg/census-levels';

export type Level = keyof typeof levels;
export const hasReachedLevel = (minimumLevel: Level, points: number) => {
  const level = levels[minimumLevel];
  if (!level) throw new Error(`Unknown level: ${minimumLevel}`);
  return level.points <= points;
};

export const getLevels = () => levels;

// Returns the current level for the given points.
export const getLevelForPoints = (points: number) => {
  const entries = Object.keys(levels) as Level[];
  for (const level of entries.reverse()) {
    if (hasReachedLevel(level, points)) return level;
  }
  throw new Error('No level reached');
};

export const didLevelUp = (previous: number, current: number) => {
  const previousLevel = getLevelForPoints(previous);
  const currentLevel = getLevelForPoints(current);
  return previousLevel !== currentLevel;
};
