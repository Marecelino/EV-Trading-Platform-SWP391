import axiosClient from './axiosClient';

const commissionApi = {
  getCommissions: () => {
    return axiosClient.get('/commissions');
  },

  getCommissionStats: () => {
    return axiosClient.get('/commissions/stats');
  },

  createCommission: (data: any) => {
    return axiosClient.post('/commissions', data);
  },

  // ... add other commission endpoints here
};

export default commissionApi;
