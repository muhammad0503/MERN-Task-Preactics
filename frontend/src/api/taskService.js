import apiClient from './client';

export const taskService = {
  // Fetch only the authenticated user's tasks
  getTasks: async () => {
    const response = await apiClient.get('/api/tasks');
    return response.data;
  },

  // Create a new task associated with the logged-in user
  createTask: async ({ title }) => {
    const response = await apiClient.post('/api/tasks', { title });
    return response.data;
  },

  // Update task title or completed status
  updateTask: async ({ id, title, completed }) => {
    const payload = {};
    if (title !== undefined) payload.title = title;
    if (completed !== undefined) payload.completed = completed;

    const response = await apiClient.put(`/api/tasks/${id}`, payload);
    return response.data;
  },

  // Delete a task by ID
  deleteTask: async (id) => {
    const response = await apiClient.delete(`/api/tasks/${id}`);
    return response.data;
  },
};

