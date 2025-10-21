// src/api/auctionApi.ts
import axiosClient from "./axiosClient";
import type { ApiResponse, Auction } from "../types";

const auctionApi = {
  getAuctionById: (id: string) => {
    return axiosClient.get<ApiResponse<Auction>>(`/auctions/${id}`);
  },
  placeBid: (auctionId: string, amount: number) => {
    return axiosClient.post<ApiResponse<Auction>>(
      `/auctions/${auctionId}/bids`,
      { amount }
    );
  },
  createAuction: (fullAuctionData: unknown) => {
    return axiosClient.post<ApiResponse<Auction>>("/auctions", fullAuctionData);
  },
  getActiveAuctions: () => {
    return axiosClient.get<ApiResponse<Auction[]>>("/auctions");
  },
  getAllAuctions: (status?: string, page: number = 1) => {
    return axiosClient.get<ApiResponse<Auction[]>>("/admin/auctions", {
      params: { status, page, limit: 3 },
    });
  },
  approveAuction: (auctionId: string) => {
    return axiosClient.put<ApiResponse<Auction>>(
      `/admin/auctions/${auctionId}/approve`
    );
  },
};
export default auctionApi;
