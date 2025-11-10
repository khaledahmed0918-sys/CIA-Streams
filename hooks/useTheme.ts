
import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    const initialTheme = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (initialTheme) {
      setTheme(initialTheme);
      root.classList.toggle('dark', initialTheme === 'dark');
    } else {
      const newTheme = prefersDark ? 'dark' : 'light';
      setTheme(newTheme);
      root.classList.toggle('dark', prefersDark);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    const root = window.document.documentElement;

    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
    root.classList.toggle('dark', newTheme === 'dark');
  }, [theme]);

  return { theme, toggleTheme };
};
