import { cn } from '@/utils/cn';
import { ComponentProps, FC, useCallback } from 'react';
import { InputProps, withField } from '../Field';
import { InputContainer, Variant } from '../InputContainer';

type TextAreaInputProps = ComponentProps<'textarea'> & { variant?: Variant };

const variants: Record<Variant, string> = {
  alveus: 'text-white placeholder:text-white/50',
  primary: 'text-accent-900 placeholder:text-accent-900/50',
  custom: 'text-white placeholder:text-white/50'
};

export const TextAreaInput: FC<InputProps<string> & TextAreaInputProps> = ({
  value = '',
  onChange,
  variant = 'primary',
  invalid,
  className,
  ...props
}) => {
  const refCallback = useCallback((node: HTMLTextAreaElement) => {
    if (node) {
      node.style.height = 'auto';
      node.style.height = `${node.scrollHeight}px`;

      node.addEventListener('input', () => {
        node.style.height = 'auto';
        node.style.height = `${node.scrollHeight}px`;
      });
    }
  }, []);

  return (
    <InputContainer variant={variant} className={cn(invalid && 'ring-red-500', className)}>
      <textarea
        ref={refCallback}
        className={cn('w-full min-h-full max-h-96 outline-none bg-transparent px-3 py-2 resize-y', variants[variant])}
        value={value}
        onChange={e => onChange(e.target.value)}
        {...props}
      />
    </InputContainer>
  );
};

export const TextAreaField = withField<string, TextAreaInputProps>(TextAreaInput);
