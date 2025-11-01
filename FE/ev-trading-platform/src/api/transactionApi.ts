import axiosClient from './axiosClient';
import { CreateTransactionDto, UpdateTransactionStatusDto } from '../types/api';
import { ITransaction, PaginatedTransactionsResponse } from '../types';

export interface GetTransactionsParams {
  page?: number;
  limit?: number;
  status?: string; // "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED" | "FAILED"
  buyer_id?: string;
  seller_id?: string;
  listing_id?: string;
  auction_id?: string;
  startDate?: string; // ISO 8601 date
  endDate?: string; // ISO 8601 date
}

const transactionApi = {
  // Get all transactions with filters and pagination
  // Returns: { data: ITransaction[], meta: {...}, stats: {...} }
  getTransactions: (params?: GetTransactionsParams) => {
    return axiosClient.get<PaginatedTransactionsResponse>('/transactions', { params });
  },

  // Get user's own transactions
  getMyTransactions: (params?: { as?: 'buyer' | 'seller' }) => {
    return axiosClient.get<ITransaction[]>('/transactions/my', { params });
  },

  // Get transaction by ID
  getTransactionById: (id: string) => {
    return axiosClient.get<ITransaction>(`/transactions/${id}`);
  },

  // Create new transaction
  createTransaction: (data: CreateTransactionDto) => {
    return axiosClient.post<ITransaction>('/transactions', data);
  },

  // Update transaction status
  // Body: { status, notes?, contract_id? }
  updateTransactionStatus: (id: string, data: UpdateTransactionStatusDto) => {
    return axiosClient.patch<ITransaction>(`/transactions/${id}/status`, data);
  },

  // Delete transaction
  deleteTransaction: (id: string) => {
    return axiosClient.delete(`/transactions/${id}`);
  },
};

export default transactionApi;