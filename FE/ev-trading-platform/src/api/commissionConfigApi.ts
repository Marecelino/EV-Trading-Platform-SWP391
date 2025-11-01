import axiosClient from './axiosClient';
import { CalculateCommissionDto } from '../types/api';

const commissionConfigApi = {
  getCommissionConfigs: () => {
    return axiosClient.get('/commission-configs');
  },

  getActiveCommissionConfigs: () => {
    return axiosClient.get('/commission-configs/active');
  },

  calculateCommission: (data: CalculateCommissionDto) => {
    return axiosClient.post('/commission-configs/calculate', data);
  },

  // ... add other commission config endpoints here
};

export default commissionConfigApi;
