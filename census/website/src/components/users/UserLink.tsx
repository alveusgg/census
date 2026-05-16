import { cn } from '@/utils/cn';
import { ComponentProps, FC, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface UserLinkProps extends Omit<ComponentProps<typeof Link>, 'to'> {
  user: {
    id: number;
    username: string;
  };
  children?: ReactNode;
}

export const UserLink: FC<UserLinkProps> = ({ user, children, className, ...props }) => {
  return (
    <Link
      to={`/profile/${user.id}`}
      className={cn('underline-offset-2 hover:underline', className)}
      title={user.username}
      {...props}
    >
      {children ?? user.username}
    </Link>
  );
};
