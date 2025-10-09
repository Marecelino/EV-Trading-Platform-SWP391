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
};
export default auctionApi;