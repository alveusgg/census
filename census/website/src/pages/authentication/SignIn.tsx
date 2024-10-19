import { Loading } from '@/components/loaders/Loading';
import { Meta } from '@/lib/meta';
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

  return (
    <>
      <Meta title="Sign in" />
      <Loading className="h-screen" />
    </>
  );
};
