import axiosClient from './axiosClient';
import {
  RegisterDto,
  LoginDto,
  LoginApiResponse,
  RegisterResponse,
  UpdateUserDto,
  ChangePasswordDto,
  CompleteRegistrationDto,
} from '../types/api';
import { User } from '../types';

const authApi = {
  // === BASIC AUTH ===
  register: (data: RegisterDto) => {
    return axiosClient.post<RegisterResponse>('/auth/register', data);
  },

  login: async (data: LoginDto): Promise<{ data: LoginApiResponse }> => {
    // DEBUG: Log request details
    console.log("=== AUTH API - LOGIN REQUEST ===");
    console.log("Endpoint: /auth/login");
    console.log("Request data:", { email: data.email, password: data.password ? "***" : undefined });
    console.log("Base URL:", axiosClient.defaults.baseURL);
    
    try {
      // CRITICAL FIX: Backend returns wrapped response: {success, message, data: {access_token, user, ...}}
      const response = await axiosClient.post<LoginApiResponse>('/auth/login', data);
      console.log("=== AUTH API - LOGIN SUCCESS ===");
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      console.log("Response data:", response.data);
      return response;
    } catch (error) {
      console.error("=== AUTH API - LOGIN ERROR ===");
      console.error("Error in authApi.login:", error);
      throw error;
    }
  },

  completeRegistration: (data: CompleteRegistrationDto) => {
    return axiosClient.post('/auth/register/complete', data);
  },

  // === PROFILE MANAGEMENT ===
  getProfile: () => {
    return axiosClient.get<User>('/auth/profile');
  },

  updateProfile: (data: UpdateUserDto) => {
    return axiosClient.put<User>('/auth/profile', data);
  },

  changePassword: (data: ChangePasswordDto) => {
    return axiosClient.patch<{ success: boolean; message: string }>('/auth/change-password', data);
  },

  // === USER MANAGEMENT (Admin only) ===
  getUsers: () => {
    return axiosClient.get<User[]>('/auth/users');
  },

  getUserById: (id: string) => {
    return axiosClient.get<User>(`/auth/users/${id}`);
  },

  updateUser: (id: string, data: UpdateUserDto) => {
    return axiosClient.put<User>(`/auth/users/${id}`, data);
  },

  deleteUser: (id: string) => {
    return axiosClient.delete(`/auth/users/${id}`);
  },

  // === USER SEARCH & FILTERS ===
  searchUsers: (query: string) => {
    return axiosClient.get<User[]>('/auth/users/search', { params: { q: query } });
  },

  getUserStats: () => {
    return axiosClient.get('/auth/users/stats');
  },

  getUsersByRole: (role: 'user' | 'admin') => {
    return axiosClient.get<User[]>(`/auth/users/by-role/${role}`);
  },

  // === USER ACTIONS (Admin only) ===
  approveUser: (id: string) => {
    return axiosClient.patch(`/auth/users/${id}/approve`);
  },

  banUser: (id: string) => {
    return axiosClient.patch(`/auth/users/${id}/ban`);
  },

  getUserListings: (id: string, params?: { page?: number; limit?: number; status?: string }) => {
    return axiosClient.get(`/auth/users/${id}/listings`, { params });
  },

  getUserTransactions: (id: string, params?: { as?: 'buyer' | 'seller' }) => {
    return axiosClient.get(`/auth/users/${id}/transactions`, { params });
  },

  // === SOCIAL AUTH ===
  // Note: OAuth endpoints redirect, so they should be used with window.location
  googleAuth: () => {
    // Returns redirect URL, should use window.location.href instead of axios
    const baseURL = (import.meta.env as { VITE_API_BASE_URL?: string }).VITE_API_BASE_URL || 'http://localhost:3000/api';
    return `${baseURL}/auth/google`;
  },

  facebookAuth: () => {
    // Returns redirect URL, should use window.location.href instead of axios
    const baseURL = (import.meta.env as { VITE_API_BASE_URL?: string }).VITE_API_BASE_URL || 'http://localhost:3000/api';
    return `${baseURL}/auth/facebook`;
  },
};

export default authApi;
