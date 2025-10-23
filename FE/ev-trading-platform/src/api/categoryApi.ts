import axiosClient from './axiosClient';
import { Category } from '../types';

const categoryApi = {
  getCategories: () => {
    return axiosClient.get('/categories');
  },

  getActiveCategories: () => {
    return axiosClient.get('/categories/active');
  },

  getParentCategories: () => {
    return axiosClient.get('/categories/parent');
  },

  getSubcategories: (parentId: string) => {
    return axiosClient.get(`/categories/subcategories/${parentId}`);
  },

  getCategoryById: (id: string) => {
    return axiosClient.get(`/categories/${id}`);
  },

  getCategoryByName: (name: string) => {
    return axiosClient.get(`/categories/name/${name}`);
  },

  createCategory: (data: Partial<Category>) => {
    return axiosClient.post('/categories', data);
  },

  updateCategory: (id: string, data: Partial<Category>) => {
    return axiosClient.patch(`/categories/${id}`, data);
  },

  deleteCategory: (id: string) => {
    return axiosClient.delete(`/categories/${id}`);
  },
};

export default categoryApi;
