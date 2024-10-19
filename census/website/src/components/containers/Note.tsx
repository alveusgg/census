import { cn } from '@/utils/cn';
import { FC, HTMLAttributes, PropsWithChildren } from 'react';

export const Note: FC<PropsWithChildren<HTMLAttributes<HTMLDivElement>>> = ({ children, className, ...props }) => {
  return (
    <div className={cn('bg-accent-50 px-4 text-accent-900', className)} {...props}>
      <div className="border-l border-r border-[#F5EFD7] flex flex-col divide-y divide-[#F5EFD7] pt-4 h-full">
        {children}
        <div className="pb-3" />
      </div>
    </div>
  );
};
