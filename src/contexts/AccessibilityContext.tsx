import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  screenReaderMode: boolean;
  toggleScreenReaderMode: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screenReaderMode, setScreenReaderMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('screenReaderMode');
    if (saved === 'true') {
      setScreenReaderMode(true);
    }
  }, []);

  const toggleScreenReaderMode = () => {
    const newMode = !screenReaderMode;
    setScreenReaderMode(newMode);
    localStorage.setItem('screenReaderMode', newMode.toString());
    
    // Announce the change to screen readers
    const announcement = newMode ? 'Screen reader mode enabled' : 'Screen reader mode disabled';
    const ariaLive = document.createElement('div');
    ariaLive.setAttribute('aria-live', 'polite');
    ariaLive.setAttribute('aria-atomic', 'true');
    ariaLive.style.position = 'absolute';
    ariaLive.style.left = '-10000px';
    ariaLive.textContent = announcement;
    document.body.appendChild(ariaLive);
    
    setTimeout(() => {
      document.body.removeChild(ariaLive);
    }, 1000);
  };

  useEffect(() => {
    // Apply screen reader mode styles to document
    if (screenReaderMode) {
      document.documentElement.classList.add('screen-reader-mode');
    } else {
      document.documentElement.classList.remove('screen-reader-mode');
    }
  }, [screenReaderMode]);

  return (
    <AccessibilityContext.Provider value={{ screenReaderMode, toggleScreenReaderMode }}>
      {children}
    </AccessibilityContext.Provider>
  );
};