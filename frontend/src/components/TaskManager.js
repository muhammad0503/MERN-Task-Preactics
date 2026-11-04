import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../api/taskService';

function TaskManager() {
  const queryClient = useQueryClient();

  // Local form input state
  const [title, setTitle] = useState('');

  // Local states for inline editing
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Active filter ('all' | 'active' | 'completed')
  const [filter, setFilter] = useState('all');

  // Flash message state
  const [feedback, setFeedback] = useState(null);

  // ==============================================================
  // 1. [READ / GET] TanStack Query: Fetch Tasks
  // ==============================================================
  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: taskService.getTasks,
  });

  // ==============================================================
  // 2. [CREATE / POST] TanStack Mutation: Add Task
  // ==============================================================
  const createTaskMutation = useMutation({
    mutationFn: taskService.createTask,
    onSuccess: () => {
      // Refresh tasks query after successful creation
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setTitle('');
      setFeedback({ type: 'success', text: 'Task created successfully!' });
    },
    onError: (err) => {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to create task.',
      });
    },
  });

  // ==============================================================
  // 3. [UPDATE / PUT] TanStack Mutation: Update Task
  // ==============================================================
  const updateTaskMutation = useMutation({
    mutationFn: taskService.updateTask,
    onSuccess: (updatedTask) => {
      // Invalidate to refresh cache
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditingId(null);
      setEditTitle('');
      setFeedback({
        type: 'success',
        text: `Task updated (${updatedTask.completed ? 'Completed' : 'Active'})!`,
      });
    },
    onError: (err) => {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update task.',
      });
    },
  });

  // ==============================================================
  // 4. [DELETE] TanStack Mutation: Delete Task
  // ==============================================================
  const deleteTaskMutation = useMutation({
    mutationFn: taskService.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setFeedback({ type: 'success', text: 'Task deleted successfully!' });
    },
    onError: (err) => {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete task.',
      });
    },
  });

  // Form submit handler
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setFeedback({ type: 'error', text: 'Task title is required.' });
      return;
    }
    setFeedback(null);
    createTaskMutation.mutate({ title: title.trim() });
  };

  // Toggle complete checkbox handler
  const handleToggleComplete = (task) => {
    setFeedback(null);
    updateTaskMutation.mutate({
      id: task._id,
      completed: !task.completed,
    });
  };

  // Start edit handler
  const handleStartEdit = (task) => {
    setEditingId(task._id);
    setEditTitle(task.title);
  };

  // Cancel edit handler
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  // Save edit handler
  const handleSaveEdit = (id) => {
    if (!editTitle.trim()) {
      setFeedback({ type: 'error', text: 'Task title cannot be empty.' });
      return;
    }
    setFeedback(null);
    updateTaskMutation.mutate({
      id,
      title: editTitle.trim(),
    });
  };

  // Computed values
  const completedCount = tasks.filter((t) => t.completed).length;
  const activeCount = tasks.length - completedCount;
  const progressPercent =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  return (
    <>
      {/* Progress Bar */}
      {tasks.length > 0 && (
        <div className="progress-card">
          <div className="progress-header">
            <span className="progress-label">
              Your Tasks Progress ({completedCount}/{tasks.length} Completed)
            </span>
            <span className="progress-percent">{progressPercent}%</span>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Task Creation Form */}
      <form onSubmit={handleAddTask} className="task-form">
        <div className="input-group">
          <input
            type="text"
            id="task-title-input"
            className="task-input"
            placeholder="Add a new personal task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={createTaskMutation.isPending}
            autoFocus
          />
        </div>

        <button
          type="submit"
          id="submit-post-btn"
          className="btn-add"
          disabled={createTaskMutation.isPending || !title.trim()}
        >
          {createTaskMutation.isPending ? (
            <div
              className="spinner"
              style={{ width: '16px', height: '16px', borderWidth: '2px' }}
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
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
          <span>{createTaskMutation.isPending ? 'Saving...' : 'Add Task'}</span>
        </button>
      </form>

      {/* Notification Toast */}
      {feedback && (
        <div className={`alert-toast ${feedback.type}`}>
          <span>{feedback.text}</span>
          <button className="toast-close" onClick={() => setFeedback(null)}>
            &times;
          </button>
        </div>
      )}

      {/* Filter Tabs */}
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
          }}
        >
          <h3
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Your Private Tasks ({filteredTasks.length})
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Protected & User-Isolated
          </span>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="loading-box">
            <div className="spinner" />
            <span>Loading your private tasks from database...</span>
          </div>
        ) : isError ? (
          <div className="alert-toast error">
            <span>
              {error?.response?.data?.message || 'Error loading tasks.'}
            </span>
            <button onClick={() => refetch()}>Retry</button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="9" x2="15" y2="15" />
                <line x1="15" y1="9" x2="9" y2="15" />
              </svg>
            </div>
            <h3 className="empty-title">
              {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
            </h3>
            <p className="empty-desc">
              {filter === 'all'
                ? 'Create your first task using the input above. Only you will be able to see it!'
                : `No tasks found in the "${filter}" filter tab.`}
            </p>
          </div>
        ) : (
          <ul className="task-list">
            {filteredTasks.map((task) => (
              <li
                key={task._id}
                className={`task-item ${task.completed ? 'completed' : ''}`}
              >
                <div className="task-left">
                  {/* Checkbox */}
                  <button
                    type="button"
                    className={`custom-checkbox ${
                      task.completed ? 'checked' : ''
                    }`}
                    onClick={() => handleToggleComplete(task)}
                    title={
                      task.completed ? 'Mark as Active' : 'Mark as Completed'
                    }
                    disabled={updateTaskMutation.isPending}
                  >
                    {task.completed && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  <div className="task-content">
                    {editingId === task._id ? (
                      /* Inline Edit Input */
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
                      /* Normal Title */
                      <div
                        className={`task-title ${
                          task.completed ? 'completed' : ''
                        }`}
                        onClick={() => handleToggleComplete(task)}
                      >
                        {task.title}
                      </div>
                    )}

                    <div className="task-date">
                      ID: <code>{task._id}</code> | Created:{' '}
                      {new Date(
                        task.createdAt || Date.now()
                      ).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Task Actions */}
                <div className="task-actions">
                  {editingId === task._id ? (
                    <>
                      <button
                        type="button"
                        className="btn-icon save"
                        onClick={() => handleSaveEdit(task._id)}
                        title="Save Changes (Enter)"
                        disabled={updateTaskMutation.isPending}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className="btn-icon"
                        onClick={handleCancelEdit}
                        title="Cancel (Esc)"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => handleStartEdit(task)}
                        title="Edit Task Title"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className="btn-icon delete"
                        onClick={() => deleteTaskMutation.mutate(task._id)}
                        title="Delete Task"
                        disabled={deleteTaskMutation.isPending}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
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
    </>
  );
}

export default TaskManager;

