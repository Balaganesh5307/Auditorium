import { useState, useEffect } from 'react';

interface IntroScreenProps {
  visible: boolean;
  onEnter: () => void;
}

export default function IntroScreen({ visible, onEnter }: IntroScreenProps) {
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
        <p className="intro-year">September 2026</p>
        <h1 className="intro-title">
          BUILD<span>ATHON</span>
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
