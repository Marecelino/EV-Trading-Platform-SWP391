// src/api/aiApi.ts
import axiosClient from './axiosClient';
import type { Product } from '../types';

const aiApi = {
  // Gửi thông tin sản phẩm để nhận gợi ý giá
  getPriceSuggestion: (product: Product): Promise<any> => {
    return axiosClient.post('/ai/suggest-price', { product });
  },
};

export default aiApi;