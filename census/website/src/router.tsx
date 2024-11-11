import { createBrowserRouter, RouteObject } from 'react-router-dom';
import { Main } from './layouts/Main';
import { Status } from './pages/admin/Status';
import { Authenticated } from './pages/authentication/Authenticated';
import { Redirect } from './pages/authentication/Redirect';
import { SignIn } from './pages/authentication/SignIn';
import { SignOut } from './pages/authentication/SignOut';
import { SignOutRedirect } from './pages/authentication/SignOutRedirect';
import { Capture } from './pages/captures/Capture';
import { Captures } from './pages/captures/Captures';
import { Home } from './pages/home/Home';
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
            path: '/status',
            element: <Status />
          },
          {
            path: '/captures/:id',
            element: <Capture />
          },
          {
            path: '/observations',
            element: <Observations />
          },
          {
            path: '/captures',
            element: <Captures />
          }
        ]
      }
    ]
  },
  auth
]);
