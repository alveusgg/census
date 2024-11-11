import { cn } from '@/utils/cn';
import { FC, HTMLAttributes, PropsWithChildren } from 'react';

export const Note: FC<PropsWithChildren<HTMLAttributes<HTMLDivElement>>> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn('bg-accent-50 px-4 text-accent-900 border border-accent border-opacity-50 rounded-md', className)}
      {...props}
    >
      <div className="border-l border-r border-accent border-opacity-50 flex flex-col divide-y divide-accent divide-opacity-50 h-full">
        {children}
        <div className="pb-3" />
      </div>
    </div>
  );
};
