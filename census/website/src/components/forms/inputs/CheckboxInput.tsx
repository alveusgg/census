import { FC, forwardRef } from 'react';
import { InputProps, withField } from '../Field';

import { cn } from '@/utils/cn';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

export const Checkbox = forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer shrink-0 w-[16px] h-[16px] rounded-sm border border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-500 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-accent-500 data-[state=checked]:bg-accent-500 data-[state=checked]:text-accent-800',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn('text-current')}>
      <svg
        className="relative left-[1px]"
        width="12"
        height="12"
        viewBox="0 0 8 6"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M6.78994 0.616762C6.5951 0.415438 6.27288 0.413483 6.07561 0.612428L3.52215 3.18755C3.32493 3.38645 3.0028 3.38455 2.80793 3.18334L1.9243 2.27093C1.72778 2.068 1.4023 2.06806 1.20584 2.27105L0.836641 2.65253C0.648982 2.84643 0.649033 3.15426 0.836757 3.34809L2.80689 5.38241C3.00216 5.58403 3.32509 5.58546 3.52214 5.38558L7.15714 1.69824C7.34779 1.50484 7.34921 1.19464 7.16036 0.999496L6.78994 0.616762Z"
          fill="currentColor"
        />
      </svg>
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));

interface CheckboxInputProps {}

export const CheckboxInput: FC<InputProps<boolean> & CheckboxInputProps> = ({ value, onChange, ...props }) => {
  return <Checkbox checked={value} onCheckedChange={onChange} {...props} />;
};

export const CheckboxField = withField<boolean, CheckboxInputProps>(CheckboxInput);
