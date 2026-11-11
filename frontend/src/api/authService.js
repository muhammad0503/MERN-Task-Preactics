import apiClient from './client';

export const authService = {
  // Register a new user account
  register: async ({ name, email, password }) => {
    const response = await apiClient.post('/api/auth/register', {
      name,
      email,
      password,
    });
    return response.data;
  },

  // Log in with existing credentials
  login: async ({ email, password }) => {
    const response = await apiClient.post('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  // Terminate current session
  logout: async () => {
    const response = await apiClient.post('/api/auth/logout');
    return response.data;
  },

  // Fetch current session user profile
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/api/auth/current-user');
      return response.data?.user || null;
    } catch (error) {
      // 401 Unauthorized simply means no active session exists
      if (error.response && error.response.status === 401) {
        return null;
      }
      throw error;
    }
  },
};

