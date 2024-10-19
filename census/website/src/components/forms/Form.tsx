import { cn } from '@/utils/cn';
import { FC, PropsWithChildren, useCallback } from 'react';
import { FieldValues, FormProvider, Path, PathValue, SubmitHandler, UseFormReturn } from 'react-hook-form';

export interface FormProps extends Omit<React.HTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  methods: UseFormReturn<any>;
  onSubmit: SubmitHandler<any>;
  onError?: (error: any) => void;
}

export const Form: FC<PropsWithChildren<FormProps>> = ({
  children,
  methods,
  onSubmit,
  onError = console.warn,
  className,
  ...props
}) => {
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit, onError)} className={cn(className)} {...props}>
        {children}
      </form>
    </FormProvider>
  );
};

export function useFormState<F extends FieldValues, ID extends Path<F>>(methods: UseFormReturn<F>, id: ID) {
  const setValue = useCallback(
    (valueOrFunction: PathValue<F, ID> | ((value: PathValue<F, ID>) => PathValue<F, ID>)) => {
      if (isCallable(valueOrFunction)) {
        methods.setValue(id, valueOrFunction(methods.getValues(id)), { shouldDirty: true });
      } else {
        methods.setValue(id, valueOrFunction as PathValue<F, ID>, { shouldDirty: true });
      }
    },
    [methods, id]
  );

  return [methods.watch(id), setValue] as const;
}

export function isCallable(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}
