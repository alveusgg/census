import { Loading } from '@/components/loaders/Loading';
import { useSignInUp } from '@/services/authentication/hooks';
import { FC, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const SignIn: FC = () => {
  const signIn = useSignInUp();
  const location = useLocation();

  useEffect(() => {
    const from = location.state?.from;
    signIn(from);
  }, [signIn, location]);

  return <Loading className="h-screen" />;
};
