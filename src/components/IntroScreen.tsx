import { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { formatBrandingTitle } from '../utils/branding';

interface IntroScreenProps {
  visible: boolean;
  onEnter: () => void;
}

export default function IntroScreen({ visible, onEnter }: IntroScreenProps) {
  const { eventName, eventDate } = useAdmin();
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
    } else {
      // Keep rendering during fade-out, then unmount
      const timer = setTimeout(() => setShouldRender(false), 800);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <div
      className="intro-screen"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.7s ease-out',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div className="intro-branding">
        <p className="intro-year">{eventDate}</p>
        <h1 className="intro-title">
          {formatBrandingTitle(eventName)}
        </h1>
        <p className="intro-subtitle">Interactive Auditorium Experience</p>
        <div className="intro-line" />
      </div>

      <button className="enter-btn" onClick={onEnter}>
        <span>Enter Auditorium</span>
        <span className="arrow">→</span>
      </button>
    </div>
  );
}
