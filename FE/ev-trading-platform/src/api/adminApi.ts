// src/api/adminApi.ts
import axiosClient from "./axiosClient";
type ListingStatus = "pending" | "active" | "rejected";
import type {
  ApiResponse,
  PaginatedListingsResponse,
  PaginatedTransactionsResponse,
  PaginatedUsersResponse,
  Product,
  User,
} from "../types";

const adminApi = {
  getDashboardStats: () => {
    return axiosClient.get("/admin/dashboard/stats");
  },
  getUsers: (page: number = 1, limit: number = 5) => {
    return axiosClient.get<PaginatedUsersResponse>("/admin/users", {
      params: { page, limit },
    });
  },

  updateUserStatus: (id: string, status: "active" | "suspended") => {
    return axiosClient.put<ApiResponse<User>>(`/admin/users/${id}/status`, {
      status,
    });
  },
  getListings: (
    status?: ListingStatus,
    page: number = 1,
    limit: number = 3
  ) => {
    return axiosClient.get<PaginatedListingsResponse>("/admin/listings", {
      params: { status, page, limit },
    });
  },

  updateListingStatus: (id: string, status: "active" | "rejected") => {
    return axiosClient.put<ApiResponse<Product>>(
      `/admin/listings/${id}/status`,
      { status }
    );
  },

  updateListingVerification: (id: string, isVerified: boolean) => {
    return axiosClient.put<ApiResponse<Product>>(
      `/admin/listings/${id}/verify`,
      { is_verified: isVerified }
    );
  },
  getTransactions: (status?: string, page: number = 1) => {
    return axiosClient.get<PaginatedTransactionsResponse>(
      "/admin/transactions",
      { params: { status, page, limit: 3 } }
    );
  },
  getDashboardTrends: () => {
    return axiosClient.get("/admin/dashboard/trends");
  },
};

export default adminApi;
