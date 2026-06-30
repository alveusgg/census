import { cn } from '@/utils/cn';
import { ComponentProps, FC } from 'react';
import { InputProps, withField } from '../Field';
import { InputContainer, Variant } from '../InputContainer';

interface SelectOption {
  value: string;
  label: string;
}

type SelectInputProps = Omit<ComponentProps<'select'>, 'value' | 'onChange'> & {
  options: SelectOption[];
  placeholder?: string;
  variant?: Variant;
};

const variants: Record<Variant, string> = {
  alveus: 'text-white',
  primary: 'text-accent-900',
  custom: 'text-white'
};

export const SelectInput: FC<InputProps<string> & SelectInputProps> = ({
  value = '',
  onChange,
  variant = 'primary',
  invalid,
  className,
  options,
  placeholder,
  ...props
}) => {
  return (
    <InputContainer variant={variant} className={cn(invalid && 'ring-red-500', className)}>
      <div className="grid grid-cols-[1fr_2rem]">
        <select
          className={cn(
            'col-span-full row-start-1 min-h-full w-full appearance-none bg-transparent px-3 py-2 pr-8 text-sm font-semibold outline-none max-sm:text-base',
            variants[variant],
            !value && 'opacity-75'
          )}
          value={value}
          onChange={event => onChange(event.target.value)}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 8 5"
          width="8"
          height="5"
          fill="none"
          className="pointer-events-none col-start-2 row-start-1 place-self-center text-accent-900"
        >
          <path d="M.5.5 4 4 7.5.5" stroke="currentColor" />
        </svg>
      </div>
    </InputContainer>
  );
};

export const SelectField = withField<string, SelectInputProps>(SelectInput);
