import { Loading } from '@/components/loaders/Loading';
import { Meta } from '@/lib/meta';
import { useSignOut } from '@/services/authentication/hooks';
import { FC, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useLocation } from 'react-router-dom';

export const SignOut: FC = () => {
  const location = useLocation();
  const signOut = useSignOut();
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      if (location.state?.forget) {
        localStorage.setItem('crumb:forget', 'true');
      }

      await signOut();
      navigate('/');
    })();
  }, [signOut, navigate, location]);

  return (
    <>
      <Meta title="Sign out" />
      <Loading className="h-screen" />
    </>
  );
};
