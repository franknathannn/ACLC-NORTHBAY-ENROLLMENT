"use client"

import { useState, useEffect } from 'react';

export default function ThemeDebug() {
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [htmlClass, setHtmlClass] = useState('');
  const [localStorage, setLocalStorage] = useState('');

  useEffect(() => {
    setMounted(true);
    
    // Check if dark class exists on html
    const hasDarkClass = document.documentElement.classList.contains('dark');
    setIsDarkMode(hasDarkClass);
    setHtmlClass(document.documentElement.className);
    
    // Check localStorage
    const theme = window.localStorage.getItem('theme');
    setLocalStorage(theme || 'not set');
    
    // Watch for changes
    const observer = new MutationObserver(() => {
      const hasDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(hasDark);
      setHtmlClass(document.documentElement.className);
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  if (!mounted) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 space-y-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-white min-h-screen transition-colors">
      <h1 className="text-3xl font-black">🔍 Theme Debug Panel</h1>
      
      <div className="grid gap-4">
        <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700">
          <h2 className="font-black text-lg mb-2">Dark Mode Status:</h2>
          <p className="text-2xl">{isDarkMode ? '🌙 DARK MODE' : '☀️ LIGHT MODE'}</p>
        </div>
        
        <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700">
          <h2 className="font-black text-lg mb-2">HTML Class:</h2>
          <p className="font-mono text-sm">{htmlClass || 'EMPTY (no classes)'}</p>
        </div>
        
        <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700">
          <h2 className="font-black text-lg mb-2">LocalStorage 'theme':</h2>
          <p className="font-mono text-sm">{localStorage}</p>
        </div>
        
        <div className="p-6 rounded-2xl bg-blue-100 dark:bg-blue-900 border-2 border-blue-200 dark:border-blue-700">
          <h2 className="font-black text-lg mb-2">Tailwind Test:</h2>
          <p className="text-slate-900 dark:text-white">
            This text should be BLACK in light mode, WHITE in dark mode
          </p>
        </div>
        
        <div className="p-6 rounded-2xl bg-emerald-100 dark:bg-emerald-900">
          <h2 className="font-black text-lg mb-2">Background Test:</h2>
          <p>This card should be LIGHT GREEN in light mode, DARK GREEN in dark mode</p>
        </div>
      </div>
      
      <div className="p-6 rounded-2xl bg-yellow-50 dark:bg-yellow-900 border-2 border-yellow-200 dark:border-yellow-700">
        <h2 className="font-black text-lg mb-4">⚠️ Instructions:</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Toggle light/dark mode in your sidebar</li>
          <li>Watch if this page changes colors</li>
          <li>Check if "HTML Class" shows "dark" when in dark mode</li>
          <li>If HTML Class never shows "dark", your useTheme hook isn't working</li>
          <li>If it shows "dark" but colors don't change, Tailwind config is wrong</li>
        </ol>
      </div>
      
      <button
        onClick={() => {
          document.documentElement.classList.toggle('dark');
          const hasDark = document.documentElement.classList.contains('dark');
          setIsDarkMode(hasDark);
          setHtmlClass(document.documentElement.className);
        }}
        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-colors"
      >
        🔄 Manually Toggle Dark Class
      </button>
    </div>
  );
}