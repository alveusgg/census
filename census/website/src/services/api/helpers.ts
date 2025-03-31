import type { AppRouter } from '@alveusgg/census-api';
import { inferRouterOutputs } from '@trpc/server';

export type TypeFromQuery<Hook extends (...args: any) => any, Response = ReturnType<Hook>> = Response extends {
  data: infer T;
}
  ? T extends Array<infer U>
    ? U
    : T
  : never;

export type TypeFromResponse<Fn extends (...args: any) => any, T = ReturnType<Fn>> = T extends Array<infer U> ? U : T;

export type TypeFromOutput<Output> = Output extends { data: infer T }
  ? T extends Array<infer U>
    ? U
    : T
  : Output extends Array<infer U>
    ? U
    : Output;

export type RouterOutput = inferRouterOutputs<AppRouter>;
