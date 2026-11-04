import axios from 'axios';

// Base URL points to Express backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Shared Axios client with credentials (cookies) enabled for session management
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial: attaches HTTP-only connect.sid session cookie to requests
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;

