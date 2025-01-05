import { createContext, FC, useContext, useMemo } from 'react';
import { FieldValues, RegisterOptions, useController, useFormContext } from 'react-hook-form';

type FieldInfo = {
  name: string;
};

const FieldContext = createContext<FieldInfo | null>(null);

export const Field = ({ name, children }: { name: string; children: React.ReactNode }) => {
  const info = useMemo(() => ({ name }), [name]);
  return <FieldContext.Provider value={info}>{children}</FieldContext.Provider>;
};

export const useField = () => {
  const info = useContext(FieldContext);
  if (!info) {
    throw new Error('useField must be used within a Field');
  }
  return info;
};

export type InputProps<T> = {
  value: T;
  onBlur?: () => void;
  onChange: (value: T) => void;
  name?: string;
  disabled?: boolean;
  invalid?: boolean;
};

interface Props {
  disabled?: boolean;
  rules?: Omit<RegisterOptions<FieldValues, string>, 'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'>;
}
type FieldProps<A> = A & Props;

export function withField<T, A>(Input: FC<InputProps<T> & A>): FC<FieldProps<A>> {
  const Field: FC<FieldProps<A>> = props => {
    const { name } = useField();
    const { control } = useFormContext();
    const { field, fieldState } = useController({ control, name, disabled: props.disabled, rules: props.rules });

    return (
      <Input
        {...props}
        ref={field.ref}
        name={field.name}
        disabled={field.disabled}
        invalid={fieldState.invalid}
        value={field.value}
        onBlur={field.onBlur}
        onChange={v => {
          field.onChange(v);
        }}
      />
    );
  };
  return Field;
}
