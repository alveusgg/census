import { LayoutProvider } from '@/components/layout/LayoutProvider';
import { PointsProvider } from '@/services/points/PointsProvider';
import { AnimatePresence } from 'framer-motion';
import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { Header } from './Header';
import { Achievements } from './sidebars/Achivements';
import { Menu } from './sidebars/Menu';

export const Main = () => {
  return (
    <PointsProvider>
      <LayoutProvider>
        <div className="w-screen h-svh flex pt-2 pb-2 pr-2 pl-0.5 bg-accent-200 overflow-clip">
          <Menu />
          <main className="flex-1 flex flex-col rounded-md bg-accent-100 border border-accent border-opacity-50 px-8">
            <Header />
            <Suspense>
              <div className="flex-1 flex flex-col overflow-y-scroll py-6">
                <Outlet />
              </div>
            </Suspense>
          </main>
          <AnimatePresence initial={false}>
            <Achievements />
          </AnimatePresence>
        </div>
      </LayoutProvider>
    </PointsProvider>
  );
};
