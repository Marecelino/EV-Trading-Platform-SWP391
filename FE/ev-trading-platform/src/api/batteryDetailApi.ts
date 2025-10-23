import axiosClient from './axiosClient';
import { type BatteryDetail } from '../types';

const batteryDetailApi = {
  createBatteryDetail: (data: Partial<BatteryDetail>) => {
    return axiosClient.post('/battery-details', data);
  },

  getBatteryDetails: () => {
    return axiosClient.get('/battery-details');
  },

  getBatteryDetailById: (id: string) => {
    return axiosClient.get(`/battery-details/${id}`);
  },

  getBatteryDetailByListingId: (listingId: string) => {
    return axiosClient.get(`/battery-details/by-listing/${listingId}`);
  },

  updateBatteryDetail: (id: string, data: Partial<BatteryDetail>) => {
    return axiosClient.patch(`/battery-details/${id}`, data);
  },

  deleteBatteryDetail: (id: string) => {
    return axiosClient.delete(`/battery-details/${id}`);
  },
};

export default batteryDetailApi;
