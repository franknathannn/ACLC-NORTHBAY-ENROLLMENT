"use client"

import { useEffect, useState } from 'react';

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check local storage or system preference
    const saved = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const isDark = saved === 'dark' || (!saved && systemPrefersDark);
    setIsDarkMode(isDark);
    
    // Apply class immediately - REMOVE ALL OTHER CLASSES FIRST
    document.documentElement.classList.remove('light', 'dark');
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
    }
  }, []);

  const toggleTheme = (mode: 'light' | 'dark') => {
    const isDark = mode === 'dark';
    setIsDarkMode(isDark);
    
    // CRITICAL: Remove BOTH classes first, then add the correct one
    document.documentElement.classList.remove('light', 'dark');
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
    }
    
    // Save to localStorage - force the value
    try {
      localStorage.setItem('theme', mode);
      console.log('Theme saved to localStorage:', mode);
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  };

  return { isDarkMode, toggleTheme, mounted };
}