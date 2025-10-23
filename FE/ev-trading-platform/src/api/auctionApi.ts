import axiosClient from './axiosClient';
import { Auction } from '../types';

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

  // Create new auction
  createAuction: (data: Partial<Auction>) => {
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
