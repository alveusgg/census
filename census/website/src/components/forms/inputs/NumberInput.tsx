import { cn } from '@/utils/cn';
import { ComponentProps, FC } from 'react';
import { InputProps, withField } from '../Field';
import { InputContainer, Variant } from '../InputContainer';

type NumberValue = number | undefined;
type NumberInputProps = Omit<ComponentProps<'input'>, 'type' | 'value' | 'onChange'> & { variant?: Variant };

const variants: Record<Variant, string> = {
  alveus: 'text-white placeholder:text-white/50',
  primary: 'text-accent-900 placeholder:text-accent-900/50',
  custom: 'text-white placeholder:text-white/50'
};

export const NumberInput: FC<InputProps<NumberValue> & NumberInputProps> = ({
  value,
  onChange,
  variant = 'primary',
  invalid,
  className,
  ...props
}) => {
  return (
    <InputContainer variant={variant} className={cn(invalid && 'ring-red-500', className)}>
      <input
        className={cn('w-full min-h-full outline-none bg-transparent px-3 py-2', variants[variant])}
        type="number"
        value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
        {...props}
      />
    </InputContainer>
  );
};

export const NumberField = withField<NumberValue, NumberInputProps>(NumberInput);
