import { createContext, Dispatch, FC, PropsWithChildren, SetStateAction, useContext, useMemo, useState } from 'react';

interface LayoutStore {
  sidebar: [boolean, Dispatch<SetStateAction<boolean>>];
  achievements: [boolean, Dispatch<SetStateAction<boolean>>];
}
const LayoutContext = createContext<LayoutStore | null>(null);

export const LayoutProvider: FC<PropsWithChildren> = ({ children }) => {
  const sidebar = useState(false);
  const achievements = useState(false);
  const context = useMemo(() => ({ sidebar, achievements }), [sidebar, achievements]);
  return <LayoutContext.Provider value={context}>{children}</LayoutContext.Provider>;
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

export const useSidebar = () => {
  const { sidebar } = useLayout();
  return sidebar;
};

export const useAchievements = () => {
  const { achievements } = useLayout();
  return achievements;
};
