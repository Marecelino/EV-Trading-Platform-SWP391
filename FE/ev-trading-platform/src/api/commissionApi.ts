import axiosClient from './axiosClient';
import { CreateCommissionDto } from '../types/api';

const commissionApi = {
  getCommissions: () => {
    return axiosClient.get('/commissions');
  },

  getCommissionStats: () => {
    return axiosClient.get('/commissions/stats');
  },

  createCommission: (data: CreateCommissionDto) => {
    return axiosClient.post('/commissions', data);
  },

  // ... add other commission endpoints here
};

export default commissionApi;
