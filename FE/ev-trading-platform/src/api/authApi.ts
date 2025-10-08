// src/api/authApi.ts
import axiosClient from './axiosClient';

const authApi = {
  // POST /api/auth/login
  login: (email: string, password: string) => {
    return axiosClient.post('/auth/login', { email, password });
  },

  // POST /api/auth/google/callback - Login with Google credential
  googleLogin: (credential: string) => {
    return axiosClient.post('/auth/google/callback', { credential });
  },

  // GET /api/auth/profile - Get user profile
  getProfile: () => {
    return axiosClient.get('/auth/profile');
  },

  // Google OAuth flow URL
  getGoogleAuthUrl: () => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    return `${baseURL}/auth/google`;
  },
};

export default authApi;