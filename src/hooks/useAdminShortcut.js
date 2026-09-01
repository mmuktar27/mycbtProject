// hooks/useAdminShortcut.js
import { useState, useEffect } from 'react';

export const useAdminShortcut = () => {
  const [showAdminLink, setShowAdminLink] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Ctrl+Alt+M (or Cmd+Alt+M on Mac)
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;
      const isM = e.key.toLowerCase() === 'm';

      if (isCtrlOrCmd && isAlt && isM) {
        e.preventDefault();
        setShowAdminLink(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return { showAdminLink, toggleAdminLink: () => setShowAdminLink(prev => !prev) };
};