// src/contexts/FavoritesContext.tsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import favoriteApi from '../api/favoriteApi';
import { useAuth } from './AuthContext';
import { Favorite } from '../types';

interface FavoritesContextType {
  favoriteIds: Set<string>;
  isFavorite: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => void;
  refreshFavorites: () => void;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // CRITICAL FIX: Store both favorite IDs and a map of listing_id -> favorite_id for deletion
  const [favoriteIdMap, setFavoriteIdMap] = useState<Map<string, string>>(new Map());

  const fetchFavorites = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      try {
        console.log("=== FETCHING FAVORITES ===");
        console.log("User ID:", user._id);
        
        // CRITICAL FIX: Use params object instead of positional arguments
        const response = await favoriteApi.getFavorites({ user_id: user._id, page: 1, limit: 1000 });
        console.log("=== FAVORITES API RESPONSE ===");
        console.log("Full response:", response);
        console.log("Response data:", response.data);
        
        // CRITICAL FIX: Improve response parsing to handle both nested and direct structures
        let favoritesData: Favorite[] = [];
        // Response can be Favorite[] or { data: Favorite[] } or PaginatedResponse
        const responseData = response.data as Favorite[] | { data: Favorite[] } | { data: { data: Favorite[] } };
        if (responseData && typeof responseData === 'object' && 'data' in responseData) {
          const nestedData = (responseData as { data: Favorite[] | { data: Favorite[] } }).data;
          if (Array.isArray(nestedData)) {
            favoritesData = nestedData;
          } else if (nestedData && typeof nestedData === 'object' && 'data' in nestedData && Array.isArray((nestedData as { data: Favorite[] }).data)) {
            favoritesData = (nestedData as { data: Favorite[] }).data;
          }
        } else if (Array.isArray(responseData)) {
          favoritesData = responseData;
        }
        
        // Build sets: listing IDs for quick lookup, and map for favorite ID lookup
        const ids = new Set<string>();
        const idMap = new Map<string, string>();
        
        favoritesData.forEach((fav: Favorite) => {
          const listingId = fav.listing_id as string;
          if (listingId) {
            ids.add(listingId);
            // Store mapping: listing_id -> favorite._id for deletion
            if (fav._id) {
              idMap.set(listingId, fav._id);
            }
          }
        });
        
        setFavoriteIds(ids);
        setFavoriteIdMap(idMap);
        console.log(`Loaded ${ids.size} favorite IDs`);
      } catch (error) {
        console.error("Failed to fetch favorites", error);
        setFavoriteIds(new Set());
        setFavoriteIdMap(new Map());
      } finally {
        setIsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const isFavorite = (listingId: string) => {
    return favoriteIds.has(listingId);
  };

  const toggleFavorite = async (listingId: string) => {
    if (!user) return;

    const newFavoriteIds = new Set(favoriteIds);
    const newFavoriteIdMap = new Map(favoriteIdMap);
    
    try {
      // First check if it's already a favorite
      const isCurrentlyFavorite = isFavorite(listingId);
      
      if (isCurrentlyFavorite) {
        console.log("=== REMOVING FAVORITE ===");
        console.log("Listing ID:", listingId);
        console.log("User ID:", user._id);
        
        // CRITICAL FIX: Get favorite ID from map (we stored it during fetch)
        const favoriteId = favoriteIdMap.get(listingId);
        
        if (!favoriteId) {
          console.warn("Favorite ID not found for listing, cannot delete");
          // Still remove from local state if not found on server
          newFavoriteIds.delete(listingId);
          newFavoriteIdMap.delete(listingId);
          setFavoriteIds(newFavoriteIds);
          setFavoriteIdMap(newFavoriteIdMap);
          return;
        }
        
        try {
          // CRITICAL FIX: deleteFavorite requires favorite ID, not listing ID
          await favoriteApi.deleteFavorite(favoriteId, { user_id: user._id });
          newFavoriteIds.delete(listingId);
          newFavoriteIdMap.delete(listingId);
          console.log("Favorite removed successfully");
        } catch (error: unknown) {
          // If delete fails, it might be because favorite doesn't exist
          const axiosError = error as { response?: { status?: number } };
          if (axiosError.response?.status === 404) {
            console.log("Favorite not found on server, removing from local state");
            newFavoriteIds.delete(listingId);
            newFavoriteIdMap.delete(listingId);
          } else {
            throw error;
          }
        }
      } else {
        console.log("=== ADDING FAVORITE ===");
        console.log("Listing ID:", listingId);
        console.log("User ID:", user._id);
        
        try {
          // CRITICAL FIX: Use CreateFavoriteDto structure
          const response = await favoriteApi.createFavorite({ user_id: user._id, listing_id: listingId });
          
          // Update local state with the new favorite
          newFavoriteIds.add(listingId);
          
          // Store the favorite ID if returned in response
          if (response.data?._id) {
            newFavoriteIdMap.set(listingId, response.data._id);
          }
          
          console.log("Favorite added successfully");
        } catch (error: unknown) {
          // Handle 409 Conflict - favorite already exists
          const axiosError = error as { response?: { status?: number; data?: { id?: string } } };
          if (axiosError.response?.status === 409) {
            console.log("Favorite already exists on server, adding to local state");
            newFavoriteIds.add(listingId);
            // Try to extract favorite ID from error response if available
            if (axiosError.response?.data?.id) {
              newFavoriteIdMap.set(listingId, axiosError.response.data.id);
            }
          } else {
            throw error; // Re-throw other errors
          }
        }
      }
      setFavoriteIds(newFavoriteIds);
      setFavoriteIdMap(newFavoriteIdMap);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Revert optimistic update on error
      setFavoriteIds(favoriteIds);
      setFavoriteIdMap(favoriteIdMap);
    }
  };

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFavorite, refreshFavorites: fetchFavorites, isLoading }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
