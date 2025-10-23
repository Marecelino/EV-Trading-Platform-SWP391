import axiosClient from './axiosClient';
import { RegisterDto, LoginDto, UpdateUserDto, ChangePasswordDto, CompleteRegistrationDto } from '../types';

const authApi = {
  // === BASIC AUTH ===
  register: (data: RegisterDto) => {
    return axiosClient.post('/auth/register', data);
  },

  login: (data: LoginDto) => {
    return axiosClient.post('/auth/login', data);
  },

  completeRegistration: (data: CompleteRegistrationDto) => {
    return axiosClient.post('/auth/register/complete', data);
  },

  // === PROFILE MANAGEMENT ===
  getProfile: () => {
    return axiosClient.get('/auth/profile');
  },

  updateProfile: (data: UpdateUserDto) => {
    return axiosClient.put('/auth/profile', data);
  },

  changePassword: (data: ChangePasswordDto) => {
    return axiosClient.patch('/auth/change-password', data);
  },

  // === USER MANAGEMENT (Admin only) ===
  getUsers: () => {
    return axiosClient.get('/auth/users');
  },

  getUserById: (id: string) => {
    return axiosClient.get(`/auth/users/${id}`);
  },

  updateUser: (id: string, data: UpdateUserDto) => {
    return axiosClient.put(`/auth/users/${id}`, data);
  },

  deleteUser: (id: string) => {
    return axiosClient.delete(`/auth/users/${id}`);
  },

  // === USER SEARCH & FILTERS ===
  searchUsers: (query: string) => {
    return axiosClient.get('/auth/users/search', { params: { q: query } });
  },

  getUserStats: () => {
    return axiosClient.get('/auth/users/stats');
  },

  getUsersByRole: (role: string) => {
    return axiosClient.get(`/auth/users/by-role/${role}`);
  },

  // === SOCIAL AUTH ===
  googleAuth: () => {
    return axiosClient.get('/auth/google');
  },

  googleCallback: () => {
    return axiosClient.get('/auth/google/callback');
  },

  facebookAuth: () => {
    return axiosClient.get('/auth/facebook');
  },

  facebookCallback: () => {
    return axiosClient.get('/auth/facebook/callback');
  },
};

export default authApi;
