import axiosClient from './axiosClient';

const transactionApi = {
  getTransactions: () => {
    return axiosClient.get('/transactions');
  },

  getMyTransactions: () => {
    return axiosClient.get('/transactions/my');
  },

  getTransactionById: (id: string) => {
    return axiosClient.get(`/transactions/${id}`);
  },

  createTransaction: (data: any) => {
    return axiosClient.post('/transactions', data);
  },

  deleteTransaction: (id: string) => {
    return axiosClient.delete(`/transactions/${id}`);
  },

  updateTransactionStatus: (id: string, status: string) => {
    return axiosClient.patch(`/transactions/${id}/status`, { status });
  },
};

export default transactionApi;