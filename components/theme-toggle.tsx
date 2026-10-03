"use client";
import React from 'react';
import { useTheme } from './theme-provider';

// Sun/Moon icon button for theme toggle
export function ThemeToggleButton() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-checked={isDark}
      role="switch"
      className="relative inline-flex items-center justify-center h-9 w-9 rounded-full border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20 transition focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
    >
      {/* Sun (outline) - from Heroicons */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className={`h-5 w-5 text-gold ${isDark ? 'hidden' : 'block'}`}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m7.071-14.071l-1.414 1.414M6.343 17.657l-1.414 1.414M21 12h-2M5 12H3m14.657 6.657l-1.414-1.414M7.757 7.757L6.343 6.343M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      {/* Moon (outline) - from Heroicons */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className={`h-5 w-5 text-petal ${isDark ? 'block' : 'hidden'}`}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3c.2 0 .39.01.58.03A7 7 0 1021 12.79z" />
      </svg>
    </button>
  );
}