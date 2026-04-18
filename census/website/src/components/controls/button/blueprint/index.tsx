import { cn } from '@/utils/cn';
import { ButtonHTMLAttributes, FC, forwardRef, PropsWithChildren } from 'react';
import { LinkProps, Link as RouterLink } from 'react-router-dom';
import { Loader } from '../../../loaders/Loader';
import { ButtonProps } from '../button';

export const variants = {
  primary:
    'border-accent-700/50 text-accent-800 hover:border-accent-700/70 hover:text-accent-900 hover:bg-accent-700/[0.04]',
  custom:
    'border-custom text-custom hover:border-custom-darker hover:text-custom-darker hover:bg-[color:var(--custom-color)]/[0.06]',
  danger: 'border-red-500/60 text-red-700 hover:border-red-600 hover:text-red-800 hover:bg-red-500/[0.06]',
  alveus:
    'border-alveus/60 text-alveus-darker hover:border-alveus-darker hover:text-alveus-darker hover:bg-alveus/[0.06]'
};

const baseClasses =
  'flex items-center justify-center text-center cursor-pointer gap-2 rounded-xl relative px-2.5 py-1.5 font-bold antialiased border border-dashed bg-transparent transition-colors duration-75 outline-none';

export const Button = forwardRef<
  HTMLButtonElement,
  PropsWithChildren<ButtonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> & { compact?: boolean }>
>(({ children, className, variant = 'primary', type = 'button', disabled, loading, compact, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        baseClasses,
        compact && 'text-sm px-3 py-1',
        variant && variants[variant],
        loading && 'pointer-events-none',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      type={type}
      disabled={!!disabled || !!loading}
      {...props}
    >
      {loading && (
        <span
          className={cn(
            'inset-0 absolute w-full h-full flex justify-center items-center rounded-full',
            variant && variants[variant]
          )}
        >
          <Loader />
        </span>
      )}
      {children}
    </button>
  );
});

export const Link: FC<PropsWithChildren<ButtonProps & LinkProps & { compact?: boolean }>> = ({
  children,
  className,
  disabled,
  variant = 'primary',
  compact,
  ...props
}) => {
  return (
    <RouterLink
      className={cn(
        baseClasses,
        compact && 'text-sm px-3 py-1',
        variant && variants[variant],
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </RouterLink>
  );
};
