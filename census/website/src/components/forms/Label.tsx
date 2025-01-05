import { ComponentProps, FC, ReactNode } from 'react';

export const Label: FC<ComponentProps<'label'> & { content: ReactNode }> = ({ children, content, ...props }) => {
  return (
    <label className="flex flex-col gap-1" {...props}>
      <span className="text-sm text-accent-900">{content}</span>
      {children}
    </label>
  );
};
