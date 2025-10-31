import axiosClient from './axiosClient';

const paymentApi = {
  // Create VNPay payment URL
  createPaymentUrl: (data: {
    amount: number;
    transactionId: string;
    orderDescription?: string;
  }) => {
    return axiosClient.post<{ paymentUrl: string }>('/payment/create-payment-url', data);
  },

  // Handle VNPay return/callback
  handleVNPayReturn: (queryParams: Record<string, string>) => {
    return axiosClient.get('/payment/vnpay-return', { params: queryParams });
  },

  // Get payment status
  getPaymentStatus: (transactionId: string) => {
    return axiosClient.get(`/payment/status/${transactionId}`);
  },
};

export default paymentApi;
