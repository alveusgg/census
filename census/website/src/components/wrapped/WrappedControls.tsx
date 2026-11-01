import { Slot } from '@radix-ui/react-slot';
import { ComponentProps, FC } from 'react';
import { useWrappedNavigation } from './hooks';

export interface WrappedControlProps extends ComponentProps<'button'> {
  /** Render the child element instead of a `<button>`, merging props (Radix Slot). */
  asChild?: boolean;
}

/** Advances to the next step. Disabled until the active position's `wait` has elapsed. */
export const WrappedNext: FC<WrappedControlProps> = ({ asChild, disabled, onClick, ...props }) => {
  const { next, ready } = useWrappedNavigation();
  const Component = asChild ? Slot : 'button';
  return (
    <Component
      type={asChild ? undefined : 'button'}
      disabled={disabled || !ready}
      onClick={event => {
        onClick?.(event);
        if (!event.defaultPrevented) next();
      }}
      {...props}
    />
  );
};

/** Returns to the previous step. Disabled on the first position. */
export const WrappedPrevious: FC<WrappedControlProps> = ({ asChild, disabled, onClick, ...props }) => {
  const { previous, isFirst } = useWrappedNavigation();
  const Component = asChild ? Slot : 'button';
  return (
    <Component
      type={asChild ? undefined : 'button'}
      disabled={disabled || isFirst}
      onClick={event => {
        onClick?.(event);
        if (!event.defaultPrevented) previous();
      }}
      {...props}
    />
  );
};
