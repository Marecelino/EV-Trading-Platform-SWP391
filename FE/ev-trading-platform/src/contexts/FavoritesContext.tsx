// src/contexts/FavoritesContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import favoritesApi from '../api/favoritesApi'; // Sẽ tạo file này
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favoriteIds: Set<string>;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const { user } = useAuth(); // Lấy thông tin người dùng

  // Tải danh sách yêu thích khi người dùng đăng nhập
  useEffect(() => {
    if (user) {
      favoritesApi.getFavorites().then(res => {
        if (res.data.success) {
          // API trả về mảng các object, chúng ta chỉ cần lấy listing_id
          const ids = res.data.data.map((fav: any) => fav.listing_id);
          setFavoriteIds(new Set(ids));
        }
      });
    } else {
      setFavoriteIds(new Set()); // Xóa danh sách yêu thích khi logout
    }
  }, [user]);

  const toggleFavorite = async (productId: string) => {
    const newFavoriteIds = new Set(favoriteIds);
    if (newFavoriteIds.has(productId)) {
      await favoritesApi.removeFavorite(productId);
      newFavoriteIds.delete(productId);
    } else {
      await favoritesApi.addFavorite(productId);
      newFavoriteIds.add(productId);
    }
    setFavoriteIds(newFavoriteIds);
  };

  const isFavorite = (productId: string) => favoriteIds.has(productId);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};