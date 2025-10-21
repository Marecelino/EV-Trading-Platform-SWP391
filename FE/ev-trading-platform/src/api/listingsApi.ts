// src/api/listingsApi.ts
import axiosClient from "./axiosClient";
import type { ApiResponse, Product } from "../types/index";

interface CreateListingResponse {
  listing_fee_id: string;
  amount_due: number;
}

const listingsApi = {
  // GET /api/listings
  getAll: () => {
    return axiosClient.get<ApiResponse<Product[]>>("/listings");
  },
  getById: (id: string) => {
    return axiosClient.get<ApiResponse<Product>>(`/listings/${id}`);
  },
  getMyListings: (status?: string) => {
    return axiosClient.get<ApiResponse<Product[]>>("/listings/my", {
      params: { status },
    });
  },
  create: (listingData: Partial<Product>) => {
    return axiosClient.post<ApiResponse<CreateListingResponse>>(
      "/listings",
      listingData
    );
  },
};

export default listingsApi;
