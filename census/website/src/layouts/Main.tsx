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
          <div className="flex h-svh w-full bg-accent-200 overflow-clip sm:pl-0.5 sm:pr-2 sm:pt-2 sm:pb-2">
            <Menu />
            <main className="flex-1 flex flex-col rounded-md bg-accent-50 border border-accent-300">
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
        <div className="relative flex flex-1 flex-col overflow-y-auto px-4 py-4 @container sm:px-8 sm:py-6">
          <Outlet />
        </div>
      </Suspense>
    </>
  );
};
