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
        
        const response = await favoriteApi.getFavorites(user._id, 1, 1000); // Fetch up to 1000 favorites
        console.log("=== FAVORITES API RESPONSE ===");
        console.log("Full response:", response);
        console.log("Response data:", response.data);
        
        if (response.data.data) {
          const ids = new Set(response.data.data.map((fav: Favorite) => fav.listing_id as string));
          setFavoriteIds(ids);
          console.log(`Loaded ${ids.size} favorite IDs`);
        } else if (Array.isArray(response.data)) {
          const ids = new Set(response.data.map((fav: Favorite) => fav.listing_id as string));
          setFavoriteIds(ids);
          console.log(`Loaded ${ids.size} favorite IDs`);
        } else {
          console.warn("No valid favorites data found in response");
          setFavoriteIds(new Set());
        }
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
          await favoriteApi.deleteFavorite(listingId, user._id);
          newFavoriteIds.delete(listingId);
          console.log("Favorite removed successfully");
        } catch (error: any) {
          // If delete fails, it might be because favorite doesn't exist
          if (error.response?.status === 404) {
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
          await favoriteApi.createFavorite({ user_id: user._id, listing_id: listingId });
          newFavoriteIds.add(listingId);
          console.log("Favorite added successfully");
        } catch (error: any) {
          // Handle 409 Conflict - favorite already exists
          if (error.response?.status === 409) {
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
