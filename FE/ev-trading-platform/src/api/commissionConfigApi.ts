import axiosClient from './axiosClient';

const commissionConfigApi = {
  getCommissionConfigs: () => {
    return axiosClient.get('/commission-configs');
  },

  getActiveCommissionConfigs: () => {
    return axiosClient.get('/commission-configs/active');
  },

  calculateCommission: (data: any) => {
    return axiosClient.post('/commission-configs/calculate', data);
  },

  // ... add other commission config endpoints here
};

export default commissionConfigApi;
