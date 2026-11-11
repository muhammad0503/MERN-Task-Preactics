import apiClient from './client';

export const chatService = {
  /**
   * Send a single message to the backend AI chat endpoint
   * @param {string} message - Current prompt from the user
   * @returns {Promise<{ reply: string }>} - Single reply from Gemini model
   */
  sendMessage: async (message) => {
    const response = await apiClient.post('/api/chat', { message });
    return response.data;
  },
};

