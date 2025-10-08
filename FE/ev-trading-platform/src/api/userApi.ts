// src/api/userApi.ts
import axiosClient from './axiosClient';
import type { User, ITransaction } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  // ...
}

const userApi = {
  getProfile: (): Promise<{ data: ApiResponse<User> }> => {
    return axiosClient.get('/auth/profile');
  },
  
  getMyTransactions: (): Promise<{ data: ApiResponse<ITransaction[]> }> => {
    return axiosClient.get('/transactions/my');
  },
  updateProfile: (data: Partial<User>): Promise<{ data: ApiResponse<User> }> => {
    return axiosClient.put('/auth/profile', data);
  }
  
};

export default userApi;