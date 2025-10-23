import axiosClient from './axiosClient';
import { Brand } from '../types';

const brandApi = {
  getBrands: () => {
    return axiosClient.get('/brands');
  },

  getActiveBrands: () => {
    return axiosClient.get('/brands/active');
  },

  getBrandById: (id: string) => {
    return axiosClient.get(`/brands/${id}`);
  },

  getBrandByName: (name: string) => {
    return axiosClient.get(`/brands/name/${name}`);
  },

  createBrand: (data: Partial<Brand>) => {
    return axiosClient.post('/brands', data);
  },

  updateBrand: (id: string, data: Partial<Brand>) => {
    return axiosClient.patch(`/brands/${id}`, data);
  },

  deleteBrand: (id: string) => {
    return axiosClient.delete(`/brands/${id}`);
  },
};

export default brandApi;
