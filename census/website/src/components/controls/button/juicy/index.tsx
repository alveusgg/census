import { cn } from '@/utils/cn';
import { ButtonHTMLAttributes, FC, forwardRef, PropsWithChildren } from 'react';
import { Loader } from '../../../loaders/Loader';
import { ButtonProps } from '../button';

export const variants = {
  primary: 'bg-accent-400 text-accent-950 hover:bg-accent-500 dark:text-accent-50',
  custom: 'bg-custom hover:bg-custom-darker text-white',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  alveus:
    'bg-alveus hover:bg-alveus-darker text-white dark:bg-alveus-darker dark:text-white dark:ring-1 dark:ring-inset dark:ring-accent-300/80 dark:shadow-[inset_0_-8px_0px_-0.25rem_rgba(255,254,245,0.10),inset_0_1px_0px_rgba(255,254,245,0.14)] dark:hover:bg-alveus dark:hover:shadow-[inset_0_-10px_0px_-0.25rem_rgba(255,254,245,0.22),inset_0_1px_0px_rgba(255,254,245,0.16)] dark:active:shadow-[inset_0_-6px_0px_-0.25rem_rgba(255,254,245,0.16),inset_0_1px_0px_rgba(255,254,245,0.12)] dark:data-[pressed=true]:shadow-[inset_0_-6px_0px_-0.25rem_rgba(255,254,245,0.16),inset_0_1px_0px_rgba(255,254,245,0.12)] dark:data-[toggled=true]:shadow-[inset_0_2px_0px_2px_rgba(255,254,245,0.12)]'
};

export const Button = forwardRef<
  HTMLButtonElement,
  PropsWithChildren<ButtonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> & {}>
>(
  (
    { children, variant = 'primary', type = 'button', loading, className, disabled, shortcut, onShortcut, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          `rounded-xl flex text-sm gap-2 justify-center items-center text-center cursor-pointer font-bold pt-2 pb-3 px-3.5 relative overflow-clip antialiased transition-all duration-75 outline-none`,
          'shadow-[inset_0_-9px_0px_-0.25rem_rgba(0,0,0,0.15)]',
          'hover:shadow-[inset_0_-10px_0px_-0.25rem_rgba(0,0,0,0.15)]',
          'active:shadow-[inset_0_-6px_0px_-0.25rem_rgba(0,0,0,0.15)] active:pt-2.5 active:pb-2.5',
          'data-[pressed=true]:shadow-[inset_0_-6px_0px_-0.25rem_rgba(0,0,0,0.15)] data-[pressed=true]:pt-2.5 data-[pressed=true]:pb-2.5',
          'data-[toggled=true]:shadow-[inset_0_2px_0px_2px_rgba(0,0,0,0.15)] data-[toggled=true]:pt-2.5 data-[toggled=true]:pb-2.5 hover:data-[toggled=true]:shadow-[inset_0_2px_0px_2px_rgba(0,0,0,0.15)]',
          'juicy-control',
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
              'inset-0 absolute rounded-xl w-full h-full flex justify-center items-center shadow-[inset_0_2px_0px_2px_rgba(0,0,0,0.15)]',
              'juicy-control',
              variant && variants[variant]
            )}
          >
            <Loader />
          </span>
        )}
        {children}
        {shortcut && (
          <kbd className="px-2 py-1 bg-accent-950 bg-opacity-10 rounded-md text-xs uppercase flex justify-center items-center">
            {navigator.userAgent.includes('Mac OS X') ? (
              <span className="text-[0.95rem] pr-[1px]">⌘</span>
            ) : (
              <span>CTRL+</span>
            )}
            {shortcut}
          </kbd>
        )}
      </button>
    );
  }
);

import { LinkProps, Link as RouterLink } from 'react-router-dom';

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
        `rounded-xl flex text-sm gap-2 justify-center items-center text-center cursor-pointer font-bold pt-2 pb-3 px-3.5 relative overflow-clip antialiased transition-all duration-75 outline-none`,
        'shadow-[inset_0_-9px_0px_-0.25rem_rgba(0,0,0,0.15)]',
        'hover:shadow-[inset_0_-10px_0px_-0.25rem_rgba(0,0,0,0.15)]',
        'active:shadow-[inset_0_-6px_0px_-0.25rem_rgba(0,0,0,0.15)] active:pt-2.5 active:pb-2.5',
        'data-[pressed=true]:shadow-[inset_0_-6px_0px_-0.25rem_rgba(0,0,0,0.15)] data-[pressed=true]:pt-2.5 data-[pressed=true]:pb-2.5',
        'data-[toggled=true]:shadow-[inset_0_2px_0px_2px_rgba(0,0,0,0.15)] data-[toggled=true]:pt-2.5 data-[toggled=true]:pb-2.5 hover:data-[toggled=true]:shadow-[inset_0_2px_0px_2px_rgba(0,0,0,0.15)]',
        'juicy-control',
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
