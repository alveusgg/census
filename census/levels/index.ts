import { z } from 'zod';
import { achievement, PayloadFor } from './helpers.js';
export const levels = {
  newcomer: {
    number: 1,
    points: 0,
    name: 'Newcomer'
  },
  rookie: {
    number: 2,
    points: 450,
    name: 'Rookie'
  },
  veteran: {
    number: 3,
    points: 5000,
    name: 'Veteran'
  },
  expert: {
    number: 4,
    points: 10000,
    name: 'Expert'
  }
};

const vote = achievement(
  'vote',
  20,
  z.object({
    identificationId: z.number()
  })
);

const comment = achievement(
  'comment',
  20,
  z.object({
    identificationId: z.number()
  })
);

const onboard = achievement(
  'onboard',
  200,
  z.object({
    message: z.string()
  })
);

const identify = achievement(
  'identify',
  300,
  z.object({
    identificationId: z.number()
  })
);

const shiny = achievement(
  'shiny',
  1000,
  z.object({
    identificationId: z.number()
  })
);

export const registry = {
  vote,
  onboard,
  comment,
  identify,
  shiny
};

export type Actions = keyof typeof registry;
export type AchievementPayload<K extends Actions> = PayloadFor<(typeof registry)[K]>;
type PayloadMap = {
  [K in Actions]: AchievementPayload<K>;
};

export type AnyAchievementPayload = PayloadMap[keyof PayloadMap];
