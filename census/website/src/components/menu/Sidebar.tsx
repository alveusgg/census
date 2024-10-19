import { cn } from '@/utils/cn';
import { FC, HTMLAttributes, PropsWithChildren } from 'react';
import { Note } from '../containers/Note';

export const Sidebar: FC<PropsWithChildren<HTMLAttributes<HTMLDivElement>>> = ({ children, className, ...props }) => {
  return (
    <Note
      className={cn('min-w-64 max-w-64 flex flex-col z-10', className)}
      style={{ boxShadow: '3px 0px 15px 0px rgba(0, 0, 0, 0.03)' }}
      {...props}
    >
      {children}
    </Note>
  );
};
