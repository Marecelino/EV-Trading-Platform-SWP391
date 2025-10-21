// src/api/favoritesApi.ts
import axiosClient from "./axiosClient";
import type { ApiResponse, FavoriteEntry } from "../types";

const favoritesApi = {
  getFavorites: () =>
    axiosClient.get<ApiResponse<FavoriteEntry[]>>("/favorites"),
  addFavorite: (listingId: string) =>
    axiosClient.post<ApiResponse<FavoriteEntry>>("/favorites", {
      listing_id: listingId,
    }),
  removeFavorite: (listingId: string) =>
    axiosClient.delete<ApiResponse<FavoriteEntry>>(`/favorites/${listingId}`),
};

export default favoritesApi;
