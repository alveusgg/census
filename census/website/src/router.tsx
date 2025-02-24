import { createBrowserRouter, RouteObject } from 'react-router-dom';
import { RouteErrorBoundary } from './components/feedback/ErrorBoundary';
import { NotFoundErrorBoundary } from './components/feedback/NotFoundError';
import { Main } from './layouts/Main';
import { Users } from './pages/admin/Users';
import { Authenticated } from './pages/authentication/Authenticated';
import { Redirect } from './pages/authentication/Redirect';
import { SignIn } from './pages/authentication/SignIn';
import { SignOut } from './pages/authentication/SignOut';
import { SignOutRedirect } from './pages/authentication/SignOutRedirect';
import { Capture } from './pages/captures/Capture';
import { Captures } from './pages/captures/Captures';
import { Onboarding } from './pages/forms/Onboarding';
import { Home } from './pages/home/Home';
import { IdentificationPage } from './pages/identifications/Identification';
import { Identifications } from './pages/identifications/Identifications';
import { Observations } from './pages/observations/Observations';
const auth: RouteObject = {
  path: 'auth',
  children: [
    {
      path: 'signin',
      element: <SignIn />
    },
    {
      path: 'signout',
      element: <SignOut />
    },
    {
      path: 'redirect',
      element: <Redirect />
    },
    {
      path: 'signout/redirect',
      element: <SignOutRedirect />
    }
  ]
};

export const router = createBrowserRouter([
  {
    ErrorBoundary: RouteErrorBoundary,
    element: <Authenticated />,
    children: [
      {
        element: <Main />,
        children: [
          {
            path: '/',
            element: <Home />
          },
          {
            path: 'observations',
            element: <Observations />
          },
          {
            path: 'identifications',
            element: <Identifications />,
            children: [
              {
                path: ':id',
                element: <IdentificationPage />
              }
            ]
          },
          {
            path: 'captures',

            children: [
              {
                index: true,
                element: <Captures />
              },
              {
                ErrorBoundary: () => (
                  <NotFoundErrorBoundary>sorry, that capture is not available</NotFoundErrorBoundary>
                ),
                path: ':id',
                element: <Capture />
              }
            ]
          },
          {
            path: 'forms',
            children: [
              {
                path: 'onboarding',
                element: <Onboarding />
              }
            ]
          },
          {
            path: 'users',
            element: <Users />
          }
        ]
      }
    ]
  },
  auth
]);
