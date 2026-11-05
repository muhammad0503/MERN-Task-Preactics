import React from 'react';
import './App.css';
import { useAuth } from './context/AuthContext';
import AuthCard from './components/AuthCard';
import TaskManager from './components/TaskManager';

function App() {
  const { user, isAuthenticated, isUserLoading, logout, isAuthActionLoading } =
    useAuth();

  return (
    <div className="app-wrapper">
      {isUserLoading ? (
        // Full screen / initial session verification spinner
        <div className="loading-box" style={{ marginTop: '80px' }}>
          <div className="spinner" style={{ width: '36px', height: '36px' }} />
          <span style={{ marginTop: '12px', fontSize: '14px', color: '#94a3b8' }}>
            Checking user session...
          </span>
        </div>
      ) : !isAuthenticated ? (
        // If not authenticated, display Register / Sign-in card
        <AuthCard />
      ) : (
        // Authenticated workspace: display personal task tracker
        <div className="task-container">
          {/* Header */}
          <header className="app-header">
            <div className="brand">
              <div className="brand-icon">
                <svg
                  width="22"
                  height="22"
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
              <div>
                <h1 className="brand-title">TaskFlow</h1>
                <span className="brand-subtitle">Private Tasks Workspace</span>
              </div>
            </div>

            {/* User Profile & Logout */}
            <div className="user-profile-bar">
              <div className="user-badge">
                <div className="user-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="user-details">
                  <span className="user-name">{user?.name || 'User'}</span>
                  <span className="user-email">{user?.email}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn-logout"
                onClick={logout}
                disabled={isAuthActionLoading}
                title="Sign out of your account"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </header>

          {/* User's Task Manager (CRUD with TanStack Query) */}
          <TaskManager />
        </div>
      )}
    </div>
  );
}

export default App;
