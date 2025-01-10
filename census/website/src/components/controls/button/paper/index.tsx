import { cn } from '@/utils/cn';
import { ButtonHTMLAttributes, FC, forwardRef, PropsWithChildren } from 'react';
import { LinkProps, Link as RouterLink } from 'react-router-dom';
import { Loader } from '../../../loaders/Loader';
import { ButtonProps } from '../button';

export const variants = {
  primary:
    'bg-accent-700 bg-opacity-[0.05] hover:bg-opacity-[0.08] border border-accent-700 border-opacity-10 text-accent-900',
  custom: 'bg-custom hover:bg-custom-darker text-white',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  alveus: 'bg-alveus hover:bg-alveus-darker text-white'
};

export type PaperButtonProps = ButtonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> & {};

export const Button = forwardRef<
  HTMLButtonElement,
  PropsWithChildren<ButtonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> & {}>
>(({ children, className, variant = 'primary', type = 'button', disabled, loading, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        `flex disabled:opacity-60 items-center  cursor-pointer justify-start text-left gap-2 rounded-lg relative px-3 py-2 overflow-clip font-medium antialiased`,
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
            variant ? variants[variant] : className
          )}
        >
          <Loader />
        </span>
      )}
      {children}
    </button>
  );
});

export const Link: FC<PropsWithChildren<ButtonProps & LinkProps & {}>> = ({
  children,
  className,
  disabled,
  variant = 'primary',
  ...props
}) => {
  return (
    <RouterLink
      className={cn(
        'flex items-center justify-start text-left cursor-pointer gap-2 rounded-lg relative px-3 py-2 overflow-clip font-medium antialiased',
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
