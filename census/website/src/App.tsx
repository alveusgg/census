import { Loading } from '@/components/loaders/Loading';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';
import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ComponentErrorBoundary } from './components/feedback/ErrorBoundary';
import { Toaster } from './components/feedback/Toaster';
import { useRouter } from './router';
import { CritterAuthenticationProvider } from './services/authentication/CritterAuthenticationProvider';
import { BackstageProvider } from './services/backstage/BackstageProvider';
import { SentryProvider } from './services/logging/Sentry';
import { APIProvider } from './services/query/APIProvider';
import { QueryProvider } from './services/query/QueryProvider';

export const App = () => {
  return (
    <Suspense fallback={<Loading />}>
      <QueryProvider>
        <Suspense fallback={<Loading />}>
          <BackstageProvider>
            <Suspense fallback={<Loading />}>
              <SentryProvider>
                <CritterAuthenticationProvider>
                  <ComponentErrorBoundary>
                    <APIProvider>
                      <Toaster />
                      <Router />
                    </APIProvider>
                  </ComponentErrorBoundary>
                </CritterAuthenticationProvider>
              </SentryProvider>
            </Suspense>
          </BackstageProvider>
        </Suspense>
      </QueryProvider>
    </Suspense>
  );
};

export const Router = () => {
  const router = useRouter();
  return (
    <NuqsAdapter>
      <RouterProvider router={router} />
    </NuqsAdapter>
  );
};
