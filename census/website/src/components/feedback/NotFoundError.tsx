import { FC, PropsWithChildren } from 'react';
import { Link } from '../controls/button/paper';
import SiHome from '../icons/SiHome';
import { ErrorBoundary } from './ErrorBoundary';

export const NotFoundPage: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex flex-col bg-accent-200 items-center justify-center h-screen w-screen">
      <NotFoundError>{children}</NotFoundError>
    </div>
  );
};

export const NotFoundError: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      {NotFoundIcon}
      <div className="w-full border-b border-dashed border-accent-800 border-opacity-50" />
      <p className="text-center text-accent-900 text-lg max-w-40 leading-5 text-balance">{children}</p>
      <Link to="/" variant="primary" className="w-full">
        <SiHome className="text-xl" />
        <span>go back home</span>
      </Link>
    </div>
  );
};

export const NotFoundErrorBoundary: FC<PropsWithChildren> = ({ children }) => {
  return (
    <ErrorBoundary for={404}>
      <NotFoundError>{children}</NotFoundError>
    </ErrorBoundary>
  );
};

const NotFoundIcon = (
  <svg width="134" height="78" viewBox="0 0 134 78" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M122.219 0V77.776H133.328V0H122.219ZM94.4427 0V44.4427H111.109V33.3333H105.552V0H94.4427ZM50 0V11.1093H72.224V66.6667H61.1147V22.224H50.0053V77.7813H83.3387V0.00533295L50 0ZM27.776 0V77.776H38.8853V0H27.776ZM0 0V44.4427H16.6667V33.3333H11.1093V0H0Z"
      fill="#CEA791"
    />
  </svg>
);
