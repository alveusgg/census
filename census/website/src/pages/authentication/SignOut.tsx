import { Loading } from '@/components/loaders/Loading';
import { useSignOut } from '@/services/authentication/hooks';
import { FC, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useLocation } from 'react-router-dom';

export const SignOut: FC = () => {
  const location = useLocation();
  const forget = location.state?.forget;
  const signOut = useSignOut();
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      if (forget) {
        localStorage.setItem('crumb:forget', 'true');
      }

      await signOut();
    })();
  }, [signOut, navigate, forget]);

  return <Loading className="h-screen" />;
};
