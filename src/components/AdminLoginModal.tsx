import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '../context/AdminContext';

export default function AdminLoginModal() {
  const { isLoginModalOpen, closeLoginModal, loginAdmin } = useAdmin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const userInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoginModalOpen) {
      setUsername('');
      setPassword('');
      setError(null);
      setShowPassword(false);
      setIsShaking(false);
      setIsLoading(false);
      // Focus username input on open
      setTimeout(() => {
        userInputRef.current?.focus();
      }, 100);
    }
  }, [isLoginModalOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLoginModalOpen && !isLoading) {
        closeLoginModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoginModalOpen, closeLoginModal, isLoading]);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      const result = await loginAdmin(username, password);
      if (!result.success) {
        setError(result.error || 'Invalid username or password. Please try again.');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 600);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-backdrop" onClick={closeLoginModal}>
      <div
        className={`admin-login-card ${isShaking ? 'shake' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          className="admin-login-close-btn"
          onClick={closeLoginModal}
          title="Close"
          type="button"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="admin-login-header">
          <div className="admin-login-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2 className="admin-login-title">Admin Access</h2>
          <p className="admin-login-subtitle">
            Enter credentials to manage auditorium seating & tables
          </p>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          {error && <div className="admin-login-error">{error}</div>}

          <div className="admin-login-field">
            <label htmlFor="admin-username">Admin Username or Email</label>
            <div className="admin-login-input-wrap">
              <span className="admin-login-input-icon">👤</span>
              <input
                id="admin-username"
                ref={userInputRef}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="auditorium or email"
                autoComplete="username"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="admin-login-field">
            <label htmlFor="admin-password">Password</label>
            <div className="admin-login-input-wrap">
              <span className="admin-login-input-icon">🔒</span>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="admin-login-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                disabled={isLoading}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="admin-login-actions">
            <button
              type="button"
              className="admin-login-btn-cancel"
              onClick={closeLoginModal}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-login-btn-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span className="admin-login-spinner"></span>
                  Authenticating...
                </span>
              ) : (
                'Log In'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
