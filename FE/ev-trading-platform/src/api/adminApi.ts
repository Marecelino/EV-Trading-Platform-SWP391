// src/api/adminApi.ts
import axiosClient from './axiosClient';
type ListingStatus = 'pending' | 'active' | 'rejected';
import type { Product, User , PaginatedListingsResponse  , PaginatedTransactionsResponse ,PaginatedUsersResponse } from '../types'; 


const adminApi = {
    getDashboardStats: () => {
        return axiosClient.get('/admin/dashboard/stats');
    },
    getUsers: (page: number = 1, limit: number = 5): Promise<{ data: PaginatedUsersResponse }> => {
        return axiosClient.get('/admin/users', { params: { page, limit } });
    },

    updateUserStatus: (id: string, status: 'active' | 'suspended'): Promise<{ data: { success: boolean, data: User } }> => {
        return axiosClient.put(`/admin/users/${id}/status`, { status });
    },
    getListings: (status?: ListingStatus, page: number = 1, limit: number = 3): Promise<{ data: PaginatedListingsResponse }> => {
    return axiosClient.get('/admin/listings', { params: { status, page, limit } });
  },

    updateListingStatus: (id: string, status: 'active' | 'rejected'): Promise<{ data: { success: boolean, data: Product } }> => {
        return axiosClient.put(`/admin/listings/${id}/status`, { status });
    },

    updateListingVerification: (id: string, is_verified: boolean): Promise<{ data: { success: boolean, data: Product } }> => {
        return axiosClient.put(`/admin/listings/${id}/verify`, { is_verified });
    },
    getTransactions: (status?: string, page: number = 1): Promise<{ data: PaginatedTransactionsResponse }> => {
    return axiosClient.get('/admin/transactions', { params: { status, page, limit: 3 } });
  },
   getDashboardTrends: () => {
    return axiosClient.get('/admin/dashboard/trends');
  },
};

export default adminApi;