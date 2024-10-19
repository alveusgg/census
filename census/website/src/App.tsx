import { Loading } from '@/components/loaders/Loading';
import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from './components/feedback/Toaster';
import { router } from './router';
import { CritterAuthenticationProvider } from './services/authentication/CritterAuthenticationProvider';
import { BackstageProvider } from './services/backstage/BackstageProvider';
import { AppInsightsProvider } from './services/insights/AppInsightsProvider';
import { APIProvider } from './services/query/APIProvider';
import { QueryProvider } from './services/query/QueryProvider';

export const App = () => {
  return (
    <Suspense fallback={<Loading />}>
      <QueryProvider>
        <Suspense fallback={<Loading />}>
          <BackstageProvider>
            <Suspense fallback={<Loading />}>
              <CritterAuthenticationProvider>
                <AppInsightsProvider>
                  <APIProvider>
                    <Toaster />
                    <RouterProvider router={router} />
                  </APIProvider>
                </AppInsightsProvider>
              </CritterAuthenticationProvider>
            </Suspense>
          </BackstageProvider>
        </Suspense>
      </QueryProvider>
    </Suspense>
  );
};
