import { Loading } from '@/components/loaders/Loading';
import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ComponentErrorBoundary } from './components/feedback/ErrorBoundary';
import { Toaster } from './components/feedback/Toaster';
import { useRouter } from './router';
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
              <AppInsightsProvider>
                <CritterAuthenticationProvider>
                  <ComponentErrorBoundary>
                    <APIProvider>
                      <Toaster />
                      <Router />
                    </APIProvider>
                  </ComponentErrorBoundary>
                </CritterAuthenticationProvider>
              </AppInsightsProvider>
            </Suspense>
          </BackstageProvider>
        </Suspense>
      </QueryProvider>
    </Suspense>
  );
};

export const Router = () => {
  const router = useRouter();
  return <RouterProvider router={router} />;
};
