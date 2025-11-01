import axiosClient from './axiosClient';
import { Auction } from '../types';
import { CreateEVAuctionDto, CreateBatteryAuctionDto } from '../types/api';

const auctionApi = {
  // Get all auctions with optional status filter
  getAllAuctions: (status?: string, page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    return axiosClient.get(`/auctions?${params.toString()}`);
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

  // Delete auction
  deleteAuction: (id: string) => {
    return axiosClient.delete(`/auctions/${id}`);
  },

  // Start auction
  startAuction: (id: string) => {
    return axiosClient.post(`/auctions/${id}/start`);
  },

  // End auction
  endAuction: (id: string) => {
    return axiosClient.post(`/auctions/${id}/end`);
  },

  // Cancel auction
  cancelAuction: (id: string) => {
    return axiosClient.post(`/auctions/${id}/cancel`);
  },

  // Get bids for an auction
  getAuctionBids: (id: string) => {
    return axiosClient.get(`/auctions/${id}/bids`);
  },

  // Place a bid
  placeBid: (id: string, data: { amount: number }) => {
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
