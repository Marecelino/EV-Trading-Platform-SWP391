import axiosClient from './axiosClient';
import { Model } from '../types';

const modelApi = {
  createModel: (data: Partial<Model>) => {
    return axiosClient.post('/models', data);
  },

  getModels: () => {
    return axiosClient.get('/models');
  },

  getModelById: (id: string) => {
    return axiosClient.get(`/models/${id}`);
  },

  getModelsByBrand: (brandId: string) => {
    return axiosClient.get(`/models/brand/${brandId}`);
  },

  updateModel: (id: string, data: Partial<Model>) => {
    return axiosClient.put(`/models/${id}`, data);
  },

  deleteModel: (id: string) => {
    return axiosClient.delete(`/models/${id}`);
  },
};

export default modelApi;
