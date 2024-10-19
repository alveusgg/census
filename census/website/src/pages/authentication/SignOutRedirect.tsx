import { Loading } from '@/components/loaders/Loading';
import { FC, useEffect } from 'react';
import { useNavigate } from 'react-router';

export const SignOutRedirect: FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/');
  }, [navigate]);

  return <Loading className="h-screen" />;
};
