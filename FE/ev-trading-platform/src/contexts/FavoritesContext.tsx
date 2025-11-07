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

  const fetchFavorites = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      try {
        console.log("=== FETCHING FAVORITES ===");
        console.log("User ID:", user._id);
        
        const response = await favoriteApi.getFavorites({ user_id: user._id, page: 1, limit: 1000 });
        console.log("=== FAVORITES API RESPONSE ===");
        console.log("Full response:", response);
        console.log("Response data:", response.data);
        
        // Backend returns { data: Favorite[], meta: {...} }
        const responseData = response.data;
        let favoritesData: Favorite[] = [];
        
        if (responseData && typeof responseData === 'object' && 'data' in responseData) {
          const data = (responseData as { data: Favorite[] }).data;
          if (Array.isArray(data)) {
            favoritesData = data;
          }
        } else if (Array.isArray(responseData)) {
          favoritesData = responseData;
        }
        
        // Build set of listing IDs for quick lookup
        const ids = new Set<string>();
        
        favoritesData.forEach((fav: Favorite) => {
          // Handle populated listing_id (can be Product object or string)
          if (fav.listing_id) {
            const listingId = typeof fav.listing_id === 'object' 
              ? (fav.listing_id as { _id: string })._id 
              : fav.listing_id as string;
            if (listingId) {
              ids.add(listingId);
            }
          }
        });
        
        setFavoriteIds(ids);
        console.log(`Loaded ${ids.size} favorite IDs`);
      } catch (error) {
        console.error("Failed to fetch favorites", error);
        setFavoriteIds(new Set());
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
    
    try {
      // First check if it's already a favorite
      const isCurrentlyFavorite = isFavorite(listingId);
      
      if (isCurrentlyFavorite) {
        console.log("=== REMOVING FAVORITE ===");
        console.log("Listing ID:", listingId);
        console.log("User ID:", user._id);
        
        try {
          // Use listing ID directly for deletion (backend endpoint: DELETE /favorites/listing/:listingId)
          await favoriteApi.unfavoriteListing(listingId, { user_id: user._id });
          newFavoriteIds.delete(listingId);
          console.log("Favorite removed successfully");
        } catch (error: unknown) {
          // If delete fails, it might be because favorite doesn't exist
          const axiosError = error as { response?: { status?: number } };
          if (axiosError.response?.status === 404) {
            console.log("Favorite not found on server, removing from local state");
            newFavoriteIds.delete(listingId);
          } else {
            throw error;
          }
        }
      } else {
        console.log("=== ADDING FAVORITE ===");
        console.log("Listing ID:", listingId);
        console.log("User ID:", user._id);
        
        try {
          // Use new API method: POST /favorites/listing
          const response = await favoriteApi.favoriteListing({ 
            user_id: user._id, 
            listing_id: listingId 
          });
          
          // Update local state with the new favorite
          newFavoriteIds.add(listingId);
          console.log("Favorite added successfully");
        } catch (error: unknown) {
          // Handle 409 Conflict - favorite already exists
          const axiosError = error as { response?: { status?: number } };
          if (axiosError.response?.status === 409) {
            console.log("Favorite already exists on server, adding to local state");
            newFavoriteIds.add(listingId);
          } else {
            throw error; // Re-throw other errors
          }
        }
      }
      setFavoriteIds(newFavoriteIds);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Revert optimistic update on error
      setFavoriteIds(favoriteIds);
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
