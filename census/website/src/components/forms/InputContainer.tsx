import { cn } from '@/utils/cn';
import { ComponentProps, FC, PropsWithChildren } from 'react';

export type Variant = 'alveus' | 'primary' | 'custom';

const variants: Record<Variant, string> = {
  alveus: 'bg-alveus ring-alveus-darker text-white ring-white/30',
  primary: 'bg-accent-700 ring-accent-700/50 bg-opacity-[0.05] text-accent-900',
  custom: 'bg-custom hover:bg-custom-darker text-white'
};

export const InputContainer: FC<PropsWithChildren<ComponentProps<'div'> & { variant?: Variant }>> = ({
  children,
  className,
  variant = 'primary',
  ...props
}) => {
  return (
    <div
      className={cn(
        'group w-full transition-all duration-300 rounded-md outline-none ring-1 focus-within:ring-2',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
