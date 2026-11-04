import React, { useState, useEffect } from 'react';
import './App.css';

// Base URL of the backend API
const API_URL = 'http://localhost:5000/api/tasks';

function App() {
  // ==============================================================
  // 1. STATES
  // ==============================================================
  // Stores text input for creating a new task
  const [title, setTitle] = useState('');

  // Stores task items fetched from MongoDB
  const [tasks, setTasks] = useState([]);

  // Controls submission loading states
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Notification feedback: { type: 'success' | 'error', text: '' }
  const [message, setMessage] = useState(null);

  // States for inline task title editing
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Active filter tab ('all' | 'active' | 'completed')
  const [filter, setFilter] = useState('all');

  // ==============================================================
  // 2. [READ / GET] Fetch all tasks on component mount
  // ==============================================================
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setInitialLoading(true);

      // Step 1: Send GET request to backend API
      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load tasks from database.');
      }

      // Step 2: Store fetched tasks into local state
      if (Array.isArray(data)) {
        setTasks(data);
      }
    } catch (err) {
      console.error('GET Fetch Error:', err);
      setMessage({ type: 'error', text: 'Unable to connect to the backend server. Please ensure the server is running!' });
    } finally {
      setInitialLoading(false);
    }
  };

  // ==============================================================
  // 3. [CREATE / POST] Create and persist a new task
  // ==============================================================
  const handleAddTask = async (e) => {
    e.preventDefault(); // Prevent standard browser form submission (page reload)

    // Client-side validation
    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Task title is required!' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Step 1: Send HTTP POST request with JSON payload
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title.trim() }),
      });

      const savedTask = await response.json();

      if (!response.ok) {
        throw new Error(savedTask.message || 'Failed to create task.');
      }

      // Step 2: Prepend the newly created task to state (instant UI update)
      setTasks((prevTasks) => [savedTask, ...prevTasks]);

      // Step 3: Clear the input field
      setTitle('');

      // Step 4: Display success notification
      setMessage({ type: 'success', text: 'New task created successfully! (POST)' });

    } catch (error) {
      console.error('POST Error:', error);
      setMessage({ type: 'error', text: error.message || 'Server error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  // ==============================================================
  // 4. [UPDATE / PUT] Toggle task completion status
  // ==============================================================
  const handleToggleComplete = async (id, currentStatus) => {
    setMessage(null);

    try {
      // Step 1: Send HTTP PUT request with the inverted completed value
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !currentStatus }),
      });

      const updatedTask = await response.json();

      if (!response.ok) {
        throw new Error(updatedTask.message || 'Failed to update task status.');
      }

      // Step 2: Update the specific task in React state
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task._id === id ? updatedTask : task))
      );

      setMessage({
        type: 'success',
        text: `Task marked as "${updatedTask.completed ? 'Completed' : 'Active'}"! (PUT)`,
      });

    } catch (error) {
      console.error('PUT Toggle Error:', error);
      setMessage({ type: 'error', text: error.message || 'Status update failed.' });
    }
  };

  // ==============================================================
  // 5. [UPDATE / PUT] Edit and save task title
  // ==============================================================
  const handleStartEdit = (task) => {
    setEditingId(task._id);
    setEditTitle(task.title);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleSaveEdit = async (id) => {
    if (!editTitle.trim()) {
      setMessage({ type: 'error', text: 'Task title cannot be empty!' });
      return;
    }

    try {
      // Step 1: Send HTTP PUT request with updated title
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: editTitle.trim() }),
      });

      const updatedTask = await response.json();

      if (!response.ok) {
        throw new Error(updatedTask.message || 'Failed to update task title.');
      }

      // Step 2: Replace existing task with the updated document in state
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task._id === id ? updatedTask : task))
      );

      // Step 3: Exit inline edit mode
      setEditingId(null);
      setEditTitle('');

      setMessage({ type: 'success', text: 'Task title updated successfully! (PUT)' });

    } catch (error) {
      console.error('PUT Edit Title Error:', error);
      setMessage({ type: 'error', text: error.message || 'Title update failed.' });
    }
  };

  // ==============================================================
  // 6. [DELETE] Permanently delete a task
  // ==============================================================
  const handleDeleteTask = async (id) => {
    setMessage(null);

    try {
      // Step 1: Send HTTP DELETE request with task ID in the URL path
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete task.');
      }

      // Step 2: Remove the deleted task from React state using array filter
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== id));

      setMessage({ type: 'success', text: 'Task permanently deleted! (DELETE)' });

    } catch (error) {
      console.error('DELETE Error:', error);
      setMessage({ type: 'error', text: error.message || 'Delete request failed.' });
    }
  };

  // ==============================================================
  // 7. COMPUTED VALUES: Filtered Tasks & Progress
  // ==============================================================
  const completedCount = tasks.filter((t) => t.completed).length;
  const activeCount = tasks.length - completedCount;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true; // 'all'
  });

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
              <span className="brand-subtitle">Complete MERN CRUD Operations</span>
            </div>
          </div>

          <div className="server-status">
            <span className="status-dot online"></span>
            <span>API Connected</span>
          </div>
        </header>

        {/* Progress Bar Card */}
        {tasks.length > 0 && (
          <div className="progress-card">
            <div className="progress-header">
              <span className="progress-label">Task Progress ({completedCount}/{tasks.length} Completed)</span>
              <span className="progress-percent">{progressPercent}%</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        )}

        {/* [POST] Create Task Form */}
        <form onSubmit={handleAddTask} className="task-form">
          <div className="input-group">
            <input
              type="text"
              id="task-title-input"
              className="task-input"
              placeholder="What needs to be done? (e.g., Learn MERN CRUD Operations)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <button
            type="submit"
            id="submit-post-btn"
            className="btn-add"
            disabled={loading || !title.trim()}
          >
            {loading ? (
              <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
            <span>{loading ? 'Submitting...' : 'Create Task (POST)'}</span>
          </button>
        </form>

        {/* Notification Toast Message */}
        {message && (
          <div className={`alert-toast ${message.type}`}>
            <span>{message.text}</span>
            <button className="toast-close" onClick={() => setMessage(null)}>&times;</button>
          </div>
        )}

        {/* Filter Navigation Tabs */}
        {tasks.length > 0 && (
          <div className="controls-bar">
            <div className="filter-tabs">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All <span className="filter-badge">{tasks.length}</span>
              </button>
              <button
                className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                onClick={() => setFilter('active')}
              >
                Active <span className="filter-badge">{activeCount}</span>
              </button>
              <button
                className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Completed <span className="filter-badge">{completedCount}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tasks List */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Tasks List ({filteredTasks.length})
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              CRUD: GET, POST, PUT, DELETE
            </span>
          </div>

          {initialLoading ? (
            <div className="loading-box">
              <div className="spinner" />
              <span>Loading tasks from database...</span>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                </svg>
              </div>
              <h3 className="empty-title">
                {filter === 'all' ? 'No tasks found' : `No ${filter} tasks`}
              </h3>
              <p className="empty-desc">
                {filter === 'all'
                  ? 'Type a task in the field above and click Create Task.'
                  : `There are currently no tasks in the "${filter}" filter.`}
              </p>
            </div>
          ) : (
            <ul className="task-list">
              {filteredTasks.map((task) => (
                <li key={task._id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                  <div className="task-left">
                    {/* [PUT] Checkbox: Toggles completion status */}
                    <button
                      type="button"
                      className={`custom-checkbox ${task.completed ? 'checked' : ''}`}
                      onClick={() => handleToggleComplete(task._id, task.completed)}
                      title={task.completed ? 'Mark as Active' : 'Mark as Completed'}
                    >
                      {task.completed && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>

                    <div className="task-content">
                      {editingId === task._id ? (
                        /* Inline Edit Input Field */
                        <input
                          type="text"
                          className="edit-input"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(task._id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          autoFocus
                        />
                      ) : (
                        /* Standard Title Display */
                        <div
                          className={`task-title ${task.completed ? 'completed' : ''}`}
                          onClick={() => handleToggleComplete(task._id, task.completed)}
                        >
                          {task.title}
                        </div>
                      )}

                      <div className="task-date">
                        ID: <code>{task._id}</code> | Created: {new Date(task.createdAt || Date.now()).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* Task Actions: Edit (PUT) & Delete (DELETE) */}
                  <div className="task-actions">
                    {editingId === task._id ? (
                      <>
                        {/* Save Edit Button */}
                        <button
                          type="button"
                          className="btn-icon save"
                          onClick={() => handleSaveEdit(task._id)}
                          title="Save Changes (Enter)"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>

                        {/* Cancel Edit Button */}
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={handleCancelEdit}
                          title="Cancel (Esc)"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Edit Button */}
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleStartEdit(task)}
                          title="Edit Task Title (PUT)"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          className="btn-icon delete"
                          onClick={() => handleDeleteTask(task._id)}
                          title="Delete Task (DELETE)"
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
        </div>

      </div>
    </div>
  );
}

export default App;
