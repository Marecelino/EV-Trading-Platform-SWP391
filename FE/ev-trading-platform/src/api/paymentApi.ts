import axiosClient from './axiosClient';
import { Payment, CreateListingPaymentDto, CreateListingPaymentResponse } from '../types/api';

const paymentApi = {
  // Create VNPay payment URL
  createPaymentUrl: (data: {
    amount: number;
    transactionId: string;
    orderDescription?: string;
  }) => {
    return axiosClient.post<{ paymentUrl: string }>('/payment/create-payment-url', data);
  },

  // Create payment URL for listing purchase (Buy Now)
  // POST /api/payment/create-payment-url
  createListingPaymentUrl: (data: CreateListingPaymentDto) => {
    return axiosClient.post<CreateListingPaymentResponse>('/payment/create-payment-url', data);
  },

  // Create payment URL for auction (after auction ended)
  // POST /api/payment/auction/create-payment-url
  createAuctionPaymentUrl: (data: {
    auction_id: string;
    payment_method?: string;
    amount?: number;
    user_id?: string;
  }) => {
    return axiosClient.post<{ payment: Payment; paymentUrl: string }>('/payment/auction/create-payment-url', data);
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
