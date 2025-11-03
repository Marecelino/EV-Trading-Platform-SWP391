import axiosClient from './axiosClient';
import { Auction } from '../types';
import { CreateEVAuctionDto, CreateBatteryAuctionDto, UpdateAuctionStatusDto } from '../types/api';

const auctionApi = {
  // Get all auctions with optional status filter
  // Backend requires page, limit, and status parameters in the URL
  getAllAuctions: (status?: string, page?: number, limit?: number) => {
    const params = new URLSearchParams();
    // Always include page (default: 1)
    params.append('page', (page || 1).toString());
    // Always include limit (default: 10)
    params.append('limit', (limit || 10).toString());
    // Include status if provided
    if (status) {
      params.append('status', status);
    }
    
    const queryString = params.toString();
    return axiosClient.get(`/auctions?${queryString}`);
  },

  // Get auction by ID
  getAuctionById: (id: string) => {
    return axiosClient.get(`/auctions/${id}`);
  },

  // Create EV auction - POST /api/auctions/ev
  createEVAuction: (data: CreateEVAuctionDto) => {
    return axiosClient.post<Auction>('/auctions/ev', data);
  },

  // Create Battery auction - POST /api/auctions/battery
  createBatteryAuction: (data: CreateBatteryAuctionDto) => {
    return axiosClient.post<Auction>('/auctions/battery', data);
  },

  // Legacy - deprecated, use createEVAuction or createBatteryAuction instead
  /** @deprecated Use createEVAuction or createBatteryAuction instead */
  createAuction: (data: Partial<Auction>) => {
    console.warn('createAuction is deprecated. Use createEVAuction or createBatteryAuction instead.');
    return axiosClient.post('/auctions', data);
  },

  // Update auction
  updateAuction: (id: string, data: Partial<Auction>) => {
    return axiosClient.put(`/auctions/${id}`, data);
  },

  // Update auction status - PATCH /api/auctions/:id/status
  updateAuctionStatus: (id: string, data: UpdateAuctionStatusDto) => {
    return axiosClient.patch<Auction>(`/auctions/${id}/status`, data);
  },

  // Delete auction
  deleteAuction: (id: string) => {
    return axiosClient.delete(`/auctions/${id}`);
  },

  // Start auction - POST /api/auctions/{id}/start
  startAuction: (id: string) => {
    return axiosClient.post(`/auctions/${id}/start`);
  },

  // Activate auction - PATCH /api/auctions/{id}/activate (set live now)
  activateAuction: (id: string) => {
    return axiosClient.patch(`/auctions/${id}/activate`);
  },

  // End auction - PATCH /api/auctions/{id}/end (manually end)
  endAuction: (id: string) => {
    return axiosClient.patch(`/auctions/${id}/end`);
  },

  // Cancel auction - POST /api/auctions/{id}/cancel
  cancelAuction: (id: string) => {
    return axiosClient.post(`/auctions/${id}/cancel`);
  },

  // Get bids for an auction
  getAuctionBids: (id: string) => {
    return axiosClient.get(`/auctions/${id}/bids`);
  },

  // Place a bid
  // Backend requires user_id in body
  placeBid: (id: string, data: { user_id: string; amount: number }) => {
    return axiosClient.post(`/auctions/${id}/bids`, data);
  },

  // Get user's auctions
  getUserAuctions: (userId: string) => {
    return axiosClient.get(`/auctions/user/${userId}`);
  },

  // Get user's bids
  getUserBids: (userId: string) => {
    return axiosClient.get(`/auctions/bids/user/${userId}`);
  }
};

export default auctionApi;
