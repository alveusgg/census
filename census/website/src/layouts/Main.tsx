import { ConfettiProvider } from '@/components/layout/ConfettiProvider';
import { LayoutProvider } from '@/components/layout/LayoutProvider';
import { Loader } from '@/components/loaders/Loader';
import { PointsProvider } from '@/services/points/PointsProvider';
import { AnimatePresence } from 'framer-motion';
import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { Header } from './Header';
import { Achievements } from './sidebars/Achievements';
import { Menu } from './sidebars/Menu';

export const Main = () => {
  return (
    <PointsProvider>
      <ConfettiProvider>
        <LayoutProvider>
          <div className="w-screen h-svh flex pt-2 pb-2 pr-2 pl-0.5 bg-accent-200 overflow-clip">
            <Menu />
            <main className="flex-1 flex flex-col rounded-md bg-accent-100">
              <Outlet />
            </main>
            <AnimatePresence initial={false}>
              <Achievements />
            </AnimatePresence>
          </div>
        </LayoutProvider>
      </ConfettiProvider>
    </PointsProvider>
  );
};

export const Scrollable = () => {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <div className="flex-1 flex text-accent-900 items-center justify-center">
            <Loader />
          </div>
        }
      >
        <div className="flex-1 flex flex-col overflow-y-scroll @container py-6 px-8">
          <Outlet />
        </div>
      </Suspense>
    </>
  );
};
