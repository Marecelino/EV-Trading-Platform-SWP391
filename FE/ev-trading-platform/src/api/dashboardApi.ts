import axiosClient from './axiosClient';

const dashboardApi = {
  getDashboardStats: () => {
    return axiosClient.get('/admin/dashboard/stats');
  },

  getDashboardTrends: () => {
    return axiosClient.get('/admin/dashboard/trends');
  },
};

export default dashboardApi;
