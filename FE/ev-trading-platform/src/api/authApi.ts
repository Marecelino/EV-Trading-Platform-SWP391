import axiosClient from './axiosClient';
import { RegisterDto, LoginDto, UpdateUserDto, ChangePasswordDto, CompleteRegistrationDto } from '../types';

const authApi = {
  register: (data: RegisterDto) => {
    return axiosClient.post('/auth/register', data);
  },

  login: (data: LoginDto) => {
    return axiosClient.post('/auth/login', data);
  },

  getProfile: () => {
    return axiosClient.get('/auth/profile');
  },

  updateProfile: (data: UpdateUserDto) => {
    return axiosClient.put('/auth/profile', data);
  },

  changePassword: (data: ChangePasswordDto) => {
    return axiosClient.patch('/auth/change-password', data);
  },

  completeRegistration: (data: CompleteRegistrationDto) => {
    return axiosClient.post('/auth/register/complete', data);
  },
};

export default authApi;
