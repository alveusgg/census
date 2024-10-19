import { Loading } from '@/components/loaders/Loading';
import { Meta } from '@/lib/meta';
import { useAuthentication } from '@/services/authentication/hooks';
import { FC, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';

export const Redirect: FC = () => {
  const onRedirect = useAuthentication(state => state.onRedirect);
  const navigate = useNavigate();
  const hasBeenHandled = useRef(false);

  useEffect(() => {
    (async () => {
      // Use effects can be called multiple times, so we need to make sure we only handle the redirect once.
      if (hasBeenHandled.current) return;
      hasBeenHandled.current = true;

      try {
        const path = await onRedirect();
        if (path && path !== '/auth/redirect' && path !== '/auth/signout' && path !== '/auth/signin') {
          navigate(path);
          return;
        }

        navigate('/');
      } catch (e) {
        console.error(e);
      }
    })();
  }, [navigate, onRedirect]);

  return (
    <>
      <Meta title="Redirecting" />
      <Loading className="h-screen" />
    </>
  );
};
