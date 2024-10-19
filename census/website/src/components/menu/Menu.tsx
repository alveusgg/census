import { cn } from '@/utils/cn';
import { FC, HTMLAttributes, PropsWithChildren } from 'react';
import { Sidebar } from './Sidebar';

export const Menu: FC<PropsWithChildren<HTMLAttributes<HTMLDivElement>>> = ({ children, ...props }) => {
  return <Sidebar {...props}>{children}</Sidebar>;
};

export const MenuItem: FC<PropsWithChildren<HTMLAttributes<HTMLDivElement>>> = ({ children, className, ...props }) => {
  return (
    <div className={cn('p-1 w-full', className)} {...props}>
      {children}
    </div>
  );
};
