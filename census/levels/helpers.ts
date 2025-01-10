import { z } from 'zod';

type Achievement<T extends z.ZodSchema, K extends string> = {
  type: K;
  points: number;
  schema: T;
};

export const achievement = <T extends z.ZodSchema, K extends string>(
  type: K,
  points: number,
  schema: T
): Achievement<T, K> => {
  return {
    type,
    points,
    schema
  };
};

export type PayloadFor<T extends ReturnType<typeof achievement>> = {
  type: T['type'];
  payload: z.infer<T['schema']>;
};
