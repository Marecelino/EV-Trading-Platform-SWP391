import axiosClient from './axiosClient';
import {
  RegisterDto,
  LoginDto,
  LoginResponse,
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

  login: async (data: LoginDto): Promise<{ data: LoginResponse }> => {
    // Login response structure: { access_token, token_type, expires_in, user }
    // NOT nested in data.data
    const response = await axiosClient.post<LoginResponse>('/auth/login', data);
    return response;
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
    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/auth/google`;
  },

  facebookAuth: () => {
    // Returns redirect URL, should use window.location.href instead of axios
    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/auth/facebook`;
  },
};

export default authApi;
