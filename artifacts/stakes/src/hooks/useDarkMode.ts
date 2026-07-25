import { useState, useEffect } from 'react';

export function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('stakes-theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('stakes-theme', dark ? 'dark' : 'light');
  }, [dark]);

  // Apply on mount immediately (avoids flash)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  return { dark, toggle: () => setDark((d) => !d) };
}
