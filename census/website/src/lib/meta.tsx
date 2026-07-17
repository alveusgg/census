import { createContext, type Dispatch, type FC, type SetStateAction, useContext, useEffect, useState } from 'react';
import { Outlet, useLocation, useMatches } from 'react-router-dom';

export const APP_TITLE = 'Alveus Pollinator Census';

interface RouteMetaHandle {
  title: string;
}

interface TitleOverride {
  pathname: string;
  title: string;
}

const TitleOverrideContext = createContext<Dispatch<SetStateAction<TitleOverride | undefined>> | null>(null);

const hasMetaHandle = (handle: unknown): handle is RouteMetaHandle => {
  return typeof handle === 'object' && handle !== null && 'title' in handle && typeof handle.title === 'string';
};

export const RouteMeta = () => {
  const matches = useMatches();
  const location = useLocation();
  const [override, setOverride] = useState<TitleOverride>();
  const routeTitle = matches.reduce<string | undefined>((current, match) => {
    return hasMetaHandle(match.handle) ? match.handle.title : current;
  }, undefined);
  const title = override?.pathname === location.pathname ? override.title : routeTitle;

  useEffect(() => {
    document.title = title ? `${title} | ${APP_TITLE}` : APP_TITLE;
  }, [title]);

  return (
    <TitleOverrideContext.Provider value={setOverride}>
      <Outlet />
    </TitleOverrideContext.Provider>
  );
};

export const PageTitle: FC<{ title: string }> = ({ title }) => {
  const setOverride = useContext(TitleOverrideContext);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!setOverride) return;

    const override = { pathname, title };
    setOverride(override);

    return () => {
      setOverride(current =>
        current?.pathname === override.pathname && current.title === override.title ? undefined : current
      );
    };
  }, [pathname, setOverride, title]);

  return null;
};
