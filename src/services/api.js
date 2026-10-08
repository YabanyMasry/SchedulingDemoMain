import axios from 'axios';
import { setupMockBackend } from './mockBackend';

// Falls back to localhost when VITE_API_URL is not set in the environment
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5163/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Setup mock backend
setupMockBackend(api);

// Response interceptor is intentionally minimal here — token refresh and 401 handling
// are wired inside AuthContext so they have access to auth state
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
