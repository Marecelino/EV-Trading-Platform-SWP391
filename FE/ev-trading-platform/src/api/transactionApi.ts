import axiosClient from './axiosClient';
import { CreateTransactionDto } from '../types/api';
import { ITransaction } from '../types';

const transactionApi = {
  getTransactions: (params?: { page?: number; limit?: number; status?: string; buyer_id?: string; seller_id?: string }) => {
    return axiosClient.get<ITransaction[]>('/transactions', { params });
  },

  getMyTransactions: (params?: { as?: 'buyer' | 'seller' }) => {
    return axiosClient.get<ITransaction[]>('/transactions/my', { params });
  },

  getTransactionById: (id: string) => {
    return axiosClient.get<ITransaction>(`/transactions/${id}`);
  },

  createTransaction: (data: CreateTransactionDto) => {
    return axiosClient.post<ITransaction>('/transactions', data);
  },

  updateTransactionStatus: (id: string, status: string) => {
    return axiosClient.patch<ITransaction>(`/transactions/${id}/status`, { status });
  },

  deleteTransaction: (id: string) => {
    return axiosClient.delete(`/transactions/${id}`);
  },
};

export default transactionApi;