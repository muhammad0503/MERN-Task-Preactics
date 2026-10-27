import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api/tasks';
const HEALTH_URL = 'http://localhost:5000/api/health';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'error' | 'success', message: '' }
  
  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalTasks: 0 });
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });

  // Inline editing
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Server & MongoDB status
  const [serverOnline, setServerOnline] = useState(true);

  // Check backend & DB status
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(HEALTH_URL);
      if (res.ok) {
        const data = await res.json();
        setServerOnline(data.database === 'connected');
      } else {
        setServerOnline(false);
      }
    } catch {
      setServerOnline(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Fetch tasks
  const fetchTasks = useCallback(async (targetPage = page) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: targetPage,
        limit,
        filter,
        ...(search ? { search } : {})
      });

      const response = await fetch(`${API_BASE_URL}?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch tasks');
      }

      setTasks(data.tasks || []);
      setPagination(data.pagination || { currentPage: targetPage, totalPages: 1, totalTasks: 0 });
      if (data.stats) {
        setStats(data.stats);
      }
      setServerOnline(true);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [page, limit, filter, search]);

  useEffect(() => {
    fetchTasks(page);
  }, [fetchTasks, page]);

  // Handle Form Submit (POST)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setAlert({ type: 'error', message: 'Please enter a task title' });
      return;
    }

    setActionLoading(true);
    setAlert(null);
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmedTitle })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add task');
      }

      setTitle('');
      setAlert({ type: 'success', message: 'Task added successfully!' });
      
      // If we are on page > 1 or have filters, reset to page 1 to see the new task
      if (page !== 1) {
        setPage(1);
      } else {
        fetchTasks(1);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle complete (PATCH)
  const toggleComplete = async (task) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${task._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update task');
      }

      // Optimistic update
      setTasks(prev =>
        prev.map(t => (t._id === task._id ? { ...t, completed: !t.completed } : t))
      );
      // Refresh stats and current page
      fetchTasks(page);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  // Start editing
  const startEdit = (task) => {
    setEditingId(task._id);
    setEditTitle(task.title);
  };

  // Save edit (PATCH)
  const saveEdit = async (id) => {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      setAlert({ type: 'error', message: 'Task title cannot be empty' });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update task');
      }

      setEditingId(null);
      fetchTasks(page);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  // Delete task (DELETE)
  const deleteTask = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to delete task');
      }

      setAlert({ type: 'success', message: 'Task removed successfully' });

      // If we are deleting the only task on the page and it's not page 1
      if (tasks.length === 1 && page > 1) {
        setPage(p => p - 1);
      } else {
        fetchTasks(page);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  // Calculate completion percentage
  const completionPercentage = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="app-wrapper">
      <div className="task-container">
        {/* Header */}
        <header className="app-header">
          <div className="brand">
            <div className="brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div>
              <h1 className="brand-title">TaskFlow</h1>
              <span className="brand-subtitle">MERN Task Tracker</span>
            </div>
          </div>

          <div className="server-status" title={serverOnline ? 'Connected to MongoDB' : 'Disconnected from MongoDB'}>
            <span className={`status-dot ${serverOnline ? 'online' : 'offline'}`} />
            <span>{serverOnline ? 'MongoDB Connected' : 'DB Offline'}</span>
          </div>
        </header>

        {/* Progress Card */}
        {stats.total > 0 && (
          <div className="progress-card">
            <div className="progress-header">
              <span className="progress-label">Task Progress ({stats.completed} of {stats.total} completed)</span>
              <span className="progress-percent">{completionPercentage}%</span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Task Form */}
        <form onSubmit={handleSubmit} className="task-form">
          <div className="input-group">
            <input
              type="text"
              id="task-input"
              className="task-input"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={actionLoading}
            />
          </div>
          <button
            type="submit"
            id="add-task-btn"
            className="btn-add"
            disabled={actionLoading || !title.trim()}
          >
            {actionLoading ? (
              <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
            <span>Add Task</span>
          </button>
        </form>

        {/* Alert Notification */}
        {alert && (
          <div className={`alert-toast ${alert.type}`}>
            <span>{alert.message}</span>
            <button
              className="toast-close"
              onClick={() => setAlert(null)}
              title="Dismiss"
            >
              &times;
            </button>
          </div>
        )}

        {/* Controls: Filter & Search */}
        <div className="controls-bar">
          <div className="filter-tabs">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => { setFilter('all'); setPage(1); }}
            >
              All
              <span className="filter-badge">{stats.total}</span>
            </button>
            <button
              className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
              onClick={() => { setFilter('active'); setPage(1); }}
            >
              Active
              <span className="filter-badge">{stats.active}</span>
            </button>
            <button
              className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => { setFilter('completed'); setPage(1); }}
            >
              Completed
              <span className="filter-badge">{stats.completed}</span>
            </button>
          </div>

          <div className="search-box">
            <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div className="loading-box">
            <div className="spinner" />
            <span>Loading tasks...</span>
          </div>
        ) : tasks.length === 0 ? (
          /* Empty State */
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="9" x2="15" y2="15" />
                <line x1="15" y1="9" x2="9" y2="15" />
              </svg>
            </div>
            <h3 className="empty-title">
              {search ? 'No tasks match your search' : filter === 'completed' ? 'No completed tasks yet' : 'No tasks found'}
            </h3>
            <p className="empty-desc">
              {search ? 'Try adjusting your search keywords' : 'Add a new task above to get organized and boost your productivity!'}
            </p>
          </div>
        ) : (
          /* Task List */
          <ul className="task-list">
            {tasks.map((task) => (
              <li
                key={task._id}
                className={`task-item ${task.completed ? 'completed' : ''}`}
              >
                <div className="task-left">
                  <button
                    className={`custom-checkbox ${task.completed ? 'checked' : ''}`}
                    onClick={() => toggleComplete(task)}
                    title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                    aria-label="Toggle complete"
                  >
                    {task.completed && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  <div className="task-content">
                    {editingId === task._id ? (
                      <input
                        type="text"
                        className="edit-input"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(task._id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                      />
                    ) : (
                      <>
                        <div
                          className={`task-title ${task.completed ? 'completed' : ''}`}
                          onClick={() => toggleComplete(task)}
                        >
                          {task.title}
                        </div>
                        {task.createdAt && (
                          <div className="task-date">{formatDate(task.createdAt)}</div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="task-actions">
                  {editingId === task._id ? (
                    <>
                      <button
                        className="btn-icon save"
                        onClick={() => saveEdit(task._id)}
                        title="Save changes"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => setEditingId(null)}
                        title="Cancel"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn-icon"
                        onClick={() => startEdit(task)}
                        title="Edit task"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={() => deleteTask(task._id)}
                        title="Delete task"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination Controls */}
        <footer className="pagination-wrapper">
          <span>
            Showing {tasks.length} of {pagination.totalTasks || 0} tasks
          </span>

          <div className="pagination-controls">
            <button
              id="prev-page-btn"
              className="btn-page"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Previous
            </button>
            <span className="page-indicator">
              Page {pagination.currentPage || page} of {pagination.totalPages || 1}
            </span>
            <button
              id="next-page-btn"
              className="btn-page"
              disabled={page >= (pagination.totalPages || 1)}
              onClick={() => setPage(p => p + 1)}
            >
              Next
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;