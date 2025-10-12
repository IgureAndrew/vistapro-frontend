// src/contexts/ThemeContext.jsx
/**
 * Custom Theme Context for Vistapro
 * 
 * Provides dark mode functionality with:
 * - localStorage persistence
 * - Instant theme application (no flash)
 * - No hydration issues
 * - Vite/React optimized
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default to 'light'
  const [theme, setThemeState] = useState(() => {
    // Check localStorage on initial load
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('vistapro-theme');
      // Apply theme immediately to prevent flash
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        return 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        return 'light';
      }
    }
    return 'light';
  });

  // Function to update theme
  const setTheme = (newTheme) => {
    const themeValue = newTheme === 'dark' ? 'dark' : 'light';
    
    // Update state
    setThemeState(themeValue);
    
    // Update localStorage
    localStorage.setItem('vistapro-theme', themeValue);
    
    // Update DOM
    if (themeValue === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Toggle function for convenience
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Sync with localStorage changes (e.g., from other tabs)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'vistapro-theme') {
        const newTheme = e.newValue || 'light';
        setThemeState(newTheme);
        
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
