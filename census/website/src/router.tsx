import { useQueryClient } from '@tanstack/react-query';
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import { RouteErrorBoundary } from './components/feedback/ErrorBoundary';
import { NotFoundErrorBoundary } from './components/feedback/NotFoundError';
import { SelectionProvider } from './components/selection/SelectionProvider';
import { Main, Scrollable } from './layouts/Main';
import { RouteMeta } from './lib/meta';
import { Components } from './pages/admin/Components';
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
import { ObservationPage } from './pages/observations/ObservationPage';
import { Overlay } from './pages/overlay/Overlay';
import { LaunchDay } from './pages/posts/LaunchDay';
import { MyProfile } from './pages/profile/MyProfile';
import { UserProfile } from './pages/profile/UserProfile';
import { useLeaderboard, usePendingAchievements, usePermissions, usePoints } from './services/api/me';
import { useUnconfirmedObservationCount } from './services/api/observations';
import { useCurrentSeason, useShiniesForSeason } from './services/api/seasons';

const auth: RouteObject = {
  path: 'auth',
  handle: { title: 'Authentication' },
  children: [
    {
      path: 'signin',
      handle: { title: 'Sign In' },
      element: <SignIn />
    },
    {
      path: 'signout',
      handle: { title: 'Sign Out' },
      element: <SignOut />
    },
    {
      path: 'redirect',
      handle: { title: 'Redirecting' },
      element: <Redirect />
    },
    {
      path: 'signout/redirect',
      handle: { title: 'Signing Out' },
      element: <SignOutRedirect />
    }
  ]
};

export const useRouter = () => {
  const client = useQueryClient();

  const permissions = usePermissions();
  const season = useCurrentSeason();
  const points = usePoints();
  const pendingAchievements = usePendingAchievements();
  const leaderboard = useLeaderboard();
  const shinies = useShiniesForSeason();
  const unconfirmedObservationCount = useUnconfirmedObservationCount();

  return createBrowserRouter([
    {
      element: <RouteMeta />,
      children: [
        {
          ErrorBoundary: RouteErrorBoundary,
          element: <Authenticated />,
          children: [
            {
              element: <Main />,
              loader: async () => {
                await Promise.all([
                  client.prefetchQuery(permissions),
                  client.prefetchQuery(season),
                  client.prefetchQuery(points),
                  client.prefetchQuery(pendingAchievements)
                ]);
                return null;
              },
              children: [
                {
                  element: <Scrollable />,
                  children: [
                    {
                      path: '/',
                      handle: { title: 'Home' },
                      element: <Home />,
                      loader: async () => {
                        await Promise.all([
                          client.prefetchQuery(leaderboard),
                          client.prefetchQuery(shinies),
                          client.prefetchQuery(unconfirmedObservationCount)
                        ]);

                        return null;
                      }
                    },
                    {
                      path: 'observations',
                      handle: { title: 'Observations' },
                      children: [
                        {
                          index: true,
                          handle: { title: 'Observations' },
                          element: <Observations />
                        },
                        {
                          ErrorBoundary: () => (
                            <NotFoundErrorBoundary>sorry, that observation is not available</NotFoundErrorBoundary>
                          ),
                          path: ':id',
                          handle: { title: 'Observation' },
                          element: <ObservationPage />
                        }
                      ]
                    },
                    {
                      path: 'identifications',
                      handle: { title: 'Identifications' },
                      element: (
                        <SelectionProvider>
                          <Identifications />
                        </SelectionProvider>
                      ),
                      children: [
                        {
                          path: ':id',
                          handle: { title: 'Identification' },
                          element: <IdentificationPage />
                        }
                      ]
                    },
                    {
                      path: 'captures',
                      handle: { title: 'Captures' },
                      children: [
                        {
                          index: true,
                          handle: { title: 'Captures' },
                          element: <Captures />
                        },
                        {
                          ErrorBoundary: () => (
                            <NotFoundErrorBoundary>sorry, that capture is not available</NotFoundErrorBoundary>
                          ),
                          path: ':id',
                          handle: { title: 'Capture' },
                          element: <Capture />
                        }
                      ]
                    },
                    {
                      path: 'forms',
                      handle: { title: 'Forms' },
                      children: [
                        {
                          path: 'onboarding',
                          handle: { title: 'Onboarding' },
                          element: <Onboarding />
                        }
                      ]
                    },
                    {
                      path: 'posts',
                      handle: { title: 'Posts' },
                      children: [
                        {
                          path: 'launch-day',
                          handle: { title: 'Launch Day' },
                          element: <LaunchDay />
                        }
                      ]
                    },
                    {
                      path: 'users',
                      handle: { title: 'Users' },
                      element: <Users />
                    },
                    {
                      path: 'admin/components',
                      handle: { title: 'Component Library' },
                      element: <Components />
                    },
                    {
                      path: 'profile',
                      handle: { title: 'Profile' },
                      children: [
                        {
                          path: 'me',
                          handle: { title: 'My Profile' },
                          element: <MyProfile />
                        },
                        {
                          path: ':id',
                          handle: { title: 'User Profile' },
                          element: <UserProfile />
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        auth,
        {
          path: 'overlay',
          handle: { title: 'Overlay' },
          element: <Overlay />
        }
      ]
    }
  ]);
};
