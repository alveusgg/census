import { useQueryClient } from '@tanstack/react-query';
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import { RouteErrorBoundary } from './components/feedback/ErrorBoundary';
import { NotFoundErrorBoundary } from './components/feedback/NotFoundError';
import { SelectionProvider } from './components/selection/SelectionProvider';
import { Main, Scrollable } from './layouts/Main';
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
import { useLeaderboard, usePendingAchievements, usePermissions, usePoints } from './services/api/me';
import { useCurrentSeason, useShiniesForSeason } from './services/api/seasons';
import { useRecentAchievements } from './services/api/users';
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

export const useRouter = () => {
  const client = useQueryClient();

  const permissions = usePermissions();
  const season = useCurrentSeason();
  const points = usePoints();
  const pendingAchievements = usePendingAchievements();
  const leaderboard = useLeaderboard();
  const shinies = useShiniesForSeason();
  const recentAchievements = useRecentAchievements();

  return createBrowserRouter([
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
                  element: <Home />,
                  loader: async () => {
                    await Promise.all([
                      client.prefetchQuery(leaderboard),
                      client.prefetchQuery(shinies),
                      client.prefetchQuery(leaderboard),
                      client.prefetchQuery(shinies),
                      client.prefetchQuery(recentAchievements)
                    ]);

                    return null;
                  }
                },
                {
                  path: 'observations',
                  element: <Observations />
                },
                {
                  path: 'identifications',
                  element: (
                    <SelectionProvider>
                      <Identifications />
                    </SelectionProvider>
                  ),
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
                },
                {
                  path: 'admin/components',
                  element: <Components />
                }
              ]
            }
          ]
        }
      ]
    },
    auth
  ]);
};
