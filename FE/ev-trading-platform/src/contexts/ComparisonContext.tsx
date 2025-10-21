// src/contexts/ComparisonContext.tsx
import { createContext, useState, useContext } from "react";
import type { ReactNode } from "react";
import type { Product } from "../types";

interface ComparisonContextType {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(
  undefined
);

export const ComparisonProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<Product[]>([]);
  const MAX_ITEMS = 3; // Giới hạn so sánh tối đa 3 sản phẩm

  const addItem = (product: Product) => {
    // Không thêm nếu đã có hoặc đã đạt giới hạn
    if (
      items.length >= MAX_ITEMS ||
      items.find((item) => item._id === product._id)
    ) {
      // Có thể thêm thông báo cho người dùng ở đây
      console.warn("Cannot add more items to comparison.");
      return;
    }

    // Chỉ cho phép so sánh các sản phẩm cùng loại
    if (items.length > 0) {
      const isEv = !!items[0].ev_details;
      const productIsEv = !!product.ev_details;
      if (isEv !== productIsEv) {
        alert(
          "Vui lòng chỉ so sánh các sản phẩm cùng danh mục (Xe điện hoặc Pin)."
        );
        return;
      }
    }

    setItems((prevItems) => [...prevItems, product]);
  };

  const removeItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item._id !== productId));
  };

  const isInCompare = (productId: string) => {
    return items.some((item) => item._id === productId);
  };

  return (
    <ComparisonContext.Provider
      value={{ items, addItem, removeItem, isInCompare }}
    >
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error("useComparison must be used within a ComparisonProvider");
  }
  return context;
};
