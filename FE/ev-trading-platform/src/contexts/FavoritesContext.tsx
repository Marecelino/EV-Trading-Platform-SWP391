// src/contexts/FavoritesContext.tsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import favoriteApi from '../api/favoriteApi';
import { useAuth } from './AuthContext';
import { Favorite } from '../types';

interface FavoritesContextType {
  favoriteIds: Set<string>;
  isFavorite: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => void;
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
        const response = await favoriteApi.getFavorites(user._id, 1, 1000); // Fetch up to 1000 favorites
        if (response.data.data) {
          const ids = new Set(response.data.data.map((fav: Favorite) => fav.listing_id as string));
          setFavoriteIds(ids);
        }
      } catch (error) {
        console.error("Failed to fetch favorites", error);
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
    if (isFavorite(listingId)) {
      await favoriteApi.deleteFavorite(listingId);
      newFavoriteIds.delete(listingId);
    } else {
      await favoriteApi.createFavorite({ user_id: user._id, listing_id: listingId });
      newFavoriteIds.add(listingId);
    }
    setFavoriteIds(newFavoriteIds);
  };

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFavorite, isLoading }}>
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
