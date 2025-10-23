import axiosClient from './axiosClient';
import { IEVDetails } from '../types';

const evDetailApi = {
  createEVDetail: (data: Partial<IEVDetails>) => {
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

  updateEVDetail: (id: string, data: Partial<IEVDetails>) => {
    return axiosClient.put(`/evdetails/${id}`, data);
  },

  deleteEVDetail: (id: string) => {
    return axiosClient.delete(`/evdetails/${id}`);
  },
};

export default evDetailApi;
