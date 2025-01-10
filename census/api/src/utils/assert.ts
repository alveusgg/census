import { AssertionError } from 'assert';
import { ZodSchema, z } from 'zod';

type Assert = (condition: unknown, message: string) => asserts condition;
type ShapeAssert = <S extends ZodSchema>(schema: S, data: unknown, message: string) => asserts data is z.infer<S>;

export const panic = (message: string) => {
  const error = new AssertionError({ message });
  console.error(error);
  process.exit(1);
};

export const assert: Assert & { shape: ShapeAssert } = (condition, message) => {
  if (!condition) {
    panic(message);
  }
};

assert.shape = (schema, data, message) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    panic(message);
  }
};