import { cn } from '@/utils/cn';
import { ButtonHTMLAttributes, FC, PropsWithChildren, useEffect, useRef } from 'react';
import { Loader } from '../../loaders/Loader';
import { ButtonProps, variants } from '../button';

export const Button: FC<
  PropsWithChildren<ButtonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> & {}>
> = ({
  children,
  variant = 'primary',
  type = 'button',
  loading,
  className,
  disabled,
  shortcut,
  onShortcut,
  ...props
}) => {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!shortcut || disabled) return;
    const abortController = new AbortController();

    window.addEventListener(
      'keydown',
      (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === shortcut.toLowerCase() && e.metaKey) {
          e.preventDefault();
          e.stopPropagation();

          const button = ref.current;
          if (!button) return;
          button.setAttribute('data-pressed', 'true');
          button.click();
          onShortcut?.();
          setTimeout(() => {
            button.removeAttribute('data-pressed');
          }, 150);
        }
      },
      { signal: abortController.signal }
    );
    return () => {
      abortController.abort();
    };
  }, [shortcut, disabled]);

  return (
    <button
      ref={ref}
      className={cn(
        `rounded-xl flex gap-2 justify-center items-center text-center cursor-pointer font-bold pt-2 pb-3 px-4 relative overflow-clip antialiased transition-all duration-75 outline-none`,
        'shadow-[inset_0_-9px_0px_-0.25rem_rgba(0,0,0,0.15)]',
        'hover:shadow-[inset_0_-10px_0px_-0.25rem_rgba(0,0,0,0.15)]',
        'active:shadow-[inset_0_-6px_0px_-0.25rem_rgba(0,0,0,0.15)] active:pt-2.5 active:pb-2.5',
        'data-[pressed]:shadow-[inset_0_-6px_0px_-0.25rem_rgba(0,0,0,0.15)] data-[pressed]:pt-2.5 data-[pressed]:pb-2.5',
        variant && variants[variant],
        loading && 'pointer-events-none',
        disabled && 'pointer-events-none opacity-50',
        className
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
};
