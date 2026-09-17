import { useRef, useState, useCallback } from 'react';
import { useAdmin } from '../context/AdminContext';
import { formatBrandingTitle } from '../utils/branding';

interface NavigationProps {
  onBackToHome: () => void;
}

export default function Navigation({ onBackToHome }: NavigationProps) {
  const { isAuthenticated, openLoginModal, toggleAdmin, eventName, eventYear } = useAdmin();
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);
  const [pulseActive, setPulseActive] = useState(false);

  const handleBrandClick = useCallback(() => {
    const now = Date.now();
    // If more than 3.5 seconds pass between clicks, reset counter
    if (now - lastClickTimeRef.current > 3500) {
      clickCountRef.current = 1;
    } else {
      clickCountRef.current += 1;
    }
    lastClickTimeRef.current = now;

    // Subtle secret indicator when nearing 5 clicks
    if (clickCountRef.current >= 3 && clickCountRef.current < 5) {
      setPulseActive(true);
      setTimeout(() => setPulseActive(false), 250);
    }

    // Trigger secret admin login when reaching 5 or more clicks
    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      setPulseActive(false);

      if (isAuthenticated) {
        // If already logged in this session, open the admin panel directly
        toggleAdmin();
      } else {
        // Otherwise, open the secret Admin Login modal
        openLoginModal();
      }
    }
  }, [isAuthenticated, openLoginModal, toggleAdmin]);

  return (
    <nav className="navigation">
      <div
        className={`nav-brand ${pulseActive ? 'secret-pulse' : ''}`}
        onClick={handleBrandClick}
        title={`${eventName} ${eventYear}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleBrandClick();
        }}
      >
        {formatBrandingTitle(eventName)} {eventYear}
      </div>
      <button className="nav-back-btn visible" onClick={onBackToHome}>
        <span className="arrow">←</span>
        <span>Home</span>
      </button>
    </nav>
  );
}
