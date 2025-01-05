import { cn } from '@/utils/cn';
import { ComponentProps, FC } from 'react';
import { InputProps, withField } from '../Field';
import { InputContainer, Variant } from '../InputContainer';

type TextInputProps = ComponentProps<'input'> & { variant?: Variant };

const variants: Record<Variant, string> = {
  alveus: 'text-white placeholder:text-white/50',
  primary: 'text-accent-900 placeholder:text-accent-900/50',
  custom: 'text-white placeholder:text-white/50'
};

export const TextInput: FC<InputProps<string> & TextInputProps> = ({
  value = '',
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
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        {...props}
      />
    </InputContainer>
  );
};

export const TextField = withField<string, TextInputProps>(TextInput);
