import axiosClient from './axiosClient';
import { type EVDetail } from '../types';

const evDetailApi = {
  createEVDetail: (data: Partial<EVDetail>) => {
    return axiosClient.post('/evdetails', data);
  },

  getEVDetails: () => {
    return axiosClient.get('/evdetails');
  },

  getEVDetailById: (id: string) => {
    return axiosClient.get(`/evdetails/${id}`);
  },

  getEVDetailByListingId: (listingId: string) => {
    return axiosClient.get(`/evdetails/listing/${listingId}`);
  },

  updateEVDetail: (id: string, data: Partial<EVDetail>) => {
    return axiosClient.put(`/evdetails/${id}`, data);
  },

  deleteEVDetail: (id: string) => {
    return axiosClient.delete(`/evdetails/${id}`);
  },
};

export default evDetailApi;
