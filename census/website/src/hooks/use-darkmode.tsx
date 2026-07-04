import { useEffect } from 'react';

export const useDarkMode = () => {
  useEffect(() => {
    if (
      window.location.search.includes('supersecretbetadarkmode=true') ||
      window.localStorage.getItem('darkmode') === 'true'
    ) {
      window.localStorage.setItem('darkmode', 'true');
      document.documentElement.classList.add('dark');
    }
  }, []);
};
