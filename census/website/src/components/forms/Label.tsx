import { cn } from '@/utils/cn';
import { ComponentProps, FC, ReactNode } from 'react';

export const Label: FC<ComponentProps<'label'> & { content: ReactNode }> = ({
  children,
  content,
  className,
  ...props
}) => {
  return (
    <label className={cn('flex flex-col gap-1', className)} {...props}>
      <span className="text-sm text-accent-900">{content}</span>
      {children}
    </label>
  );
};
