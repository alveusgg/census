import { Loading } from '@/components/loaders/Loading';
import { FC, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';

export const NotAuthenticated: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    navigate('/auth/signin', { state: { from: `${location.pathname}${location.search}` } });
  }, [navigate, location]);

  return <Loading className="h-screen" />;
};
