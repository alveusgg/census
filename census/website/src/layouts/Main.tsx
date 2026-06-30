import { ConfettiProvider } from '@/components/layout/ConfettiProvider';
import { LayoutProvider } from '@/components/layout/LayoutProvider';
import { Loader } from '@/components/loaders/Loader';
import { ScrollArea } from '@/components/ui/scroll-area';
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
          <div className="flex h-screen w-full overflow-hidden bg-accent-200 supports-[height:100svh]:h-svh sm:pl-0.5 sm:pr-2 sm:pt-2 sm:pb-2">
            <Menu />
            <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-accent-300 bg-accent-50">
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
        <ScrollArea className="min-h-0 flex-1 @container [&>[data-radix-scroll-area-viewport]>div]:min-h-full">
          <div className="relative flex min-h-full flex-col px-4 py-4 sm:px-8 sm:py-6">
            <Outlet />
          </div>
        </ScrollArea>
      </Suspense>
    </>
  );
};
