import { useLocalStorage } from '@uidotdev/usehooks';
import { createContext, Dispatch, FC, PropsWithChildren, SetStateAction, useContext, useMemo } from 'react';

const shouldAchievementsBeOpen = () => {
  // If the window is over 1350px wide, then the achievements should be open by default
  return window.innerWidth > 1350;
};

interface LayoutStore {
  sidebar: [boolean, Dispatch<SetStateAction<boolean>>];
  achievements: [boolean, Dispatch<SetStateAction<boolean>>];
}
const LayoutContext = createContext<LayoutStore | null>(null);

export const LayoutProvider: FC<PropsWithChildren> = ({ children }) => {
  const sidebar = useLocalStorage('sidebar', false);
  const achievements = useLocalStorage('achievements', shouldAchievementsBeOpen());
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
