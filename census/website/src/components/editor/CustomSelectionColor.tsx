import { getColorForId } from '@/services/video/utils';
import { FC, PropsWithChildren } from 'react';

export const CustomSelectionColor: FC<PropsWithChildren<{ id: number }>> = ({ id, children }) => {
  return (
    <div className="contents" style={{ '--custom-color': getColorForId(id) }}>
      {children}
    </div>
  );
};
