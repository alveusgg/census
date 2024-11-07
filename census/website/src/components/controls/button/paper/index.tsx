import { cn } from '@/utils/cn';
import { ButtonHTMLAttributes, FC, PropsWithChildren } from 'react';
import { LinkProps, Link as RouterLink } from 'react-router-dom';
import { Loader } from '../../../loaders/Loader';
import { ButtonProps, variants } from '../button';

export type PaperButtonProps = ButtonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> & {};

export const Button: FC<PropsWithChildren<PaperButtonProps>> = ({
  children,
  className,
  variant = 'alveus',
  type = 'button',
  disabled,
  loading,
  ...props
}) => {
  return (
    <button
      className={cn(
        `flex disabled:opacity-60 items-center justify-start text-left gap-2 rounded-lg relative px-3 py-2 overflow-clip font-medium antialiased`,
        variant && variants[variant],
        className,
        loading && 'pointer-events-none',
        disabled && 'pointer-events-none opacity-50'
      )}
      type={type}
      {...props}
    >
      {loading && (
        <span
          className={cn(
            'inset-0 absolute w-full h-full flex justify-center items-center',
            variant && variants[variant]
          )}
        >
          <Loader />
        </span>
      )}
      {children}
    </button>
  );
};

export const Link: FC<PropsWithChildren<ButtonProps & LinkProps & {}>> = ({
  children,
  className,
  disabled,
  variant = 'alveus',
  ...props
}) => {
  return (
    <RouterLink
      className={cn(
        'flex items-center justify-start text-left gap-2 rounded-lg relative px-3 py-2 overflow-clip font-medium antialiased',
        variant && variants[variant],
        disabled && 'pointer-events-none opacity-60',
        className
      )}
      {...props}
    >
      {children}
    </RouterLink>
  );
};
