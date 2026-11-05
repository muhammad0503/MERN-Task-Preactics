import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function AuthCard() {
  const { login, register, isAuthActionLoading } = useAuth();

  // Mode: 'login' or 'register'
  const [mode, setMode] = useState('login');

  // Form input state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Local feedback message
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!email.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setErrorMessage('Name is required for registration.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
    }

    try {
      if (mode === 'login') {
        await login({ email: email.trim(), password });
      } else {
        await register({ name: name.trim(), email: email.trim(), password });
      }
    } catch (err) {
      console.error('Auth error:', err);
      const serverMsg =
        err.response?.data?.message ||
        'Unable to complete request. Please verify server is running.';
      setErrorMessage(serverMsg);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="brand-icon">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </div>
        <h2>TaskFlow Authentication</h2>
        <p>Phase 2: Secure Session-Based Accounts</p>
      </div>

      {/* Tabs to switch between Sign In and Sign Up */}
      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
          onClick={() => {
            setMode('login');
            setErrorMessage(null);
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
          onClick={() => {
            setMode('register');
            setErrorMessage(null);
          }}
        >
          Create Account
        </button>
      </div>

      {/* Error notification */}
      {errorMessage && (
        <div className="alert-toast error" style={{ marginBottom: '18px' }}>
          <span>{errorMessage}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => setErrorMessage(null)}
          >
            &times;
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="auth-form">
        {mode === 'register' && (
          <div className="form-group">
            <label className="form-label" htmlFor="auth-name">
              Full Name
            </label>
            <input
              id="auth-name"
              type="text"
              className="form-input"
              placeholder="e.g., Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isAuthActionLoading}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="auth-email">
            Email Address
          </label>
          <input
            id="auth-email"
            type="email"
            className="form-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isAuthActionLoading}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="auth-password">
            Password {mode === 'register' && '(min 6 chars)'}
          </label>
          <input
            id="auth-password"
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isAuthActionLoading}
            required
          />
        </div>

        <button
          type="submit"
          className="btn-auth-submit"
          disabled={isAuthActionLoading}
        >
          {isAuthActionLoading ? (
            <div
              className="spinner"
              style={{ width: '18px', height: '18px', borderWidth: '2px' }}
            />
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          )}
          <span>
            {isAuthActionLoading
              ? 'Processing...'
              : mode === 'login'
              ? 'Sign In to Your Tasks'
              : 'Register & Launch Tracker'}
          </span>
        </button>
      </form>
    </div>
  );
}

export default AuthCard;

