// src/api/auctionApi.ts
import axiosClient from './axiosClient';

const auctionApi = {
  getAuctionById: (id: string): Promise<any> => {
    return axiosClient.get(`/auctions/${id}`);
  },
  placeBid: (auctionId: string, amount: number): Promise<any> => {
    return axiosClient.post(`/auctions/${auctionId}/bids`, { amount });
  },
  createAuction: (fullAuctionData: any): Promise<any> => {
    
    return axiosClient.post('/auctions', fullAuctionData);
  },
    getActiveAuctions: (): Promise<any> => {
    return axiosClient.get('/auctions');
  },
    getAllAuctions: (status?: string, page: number = 1): Promise<any> => {
    return axiosClient.get('/admin/auctions', { params: { status, page, limit: 3 } });
  },
  approveAuction: (auctionId: string): Promise<any> => {
    return axiosClient.put(`/admin/auctions/${auctionId}/approve`);
  },
};
export default auctionApi;