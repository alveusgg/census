import { FC, PropsWithChildren } from 'react';

interface TimestampProps {
  date: Date;
}

export const Timestamp: FC<PropsWithChildren<TimestampProps>> = ({ children }) => {
  return children;
};
