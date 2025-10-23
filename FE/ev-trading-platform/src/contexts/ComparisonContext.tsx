// src/contexts/ComparisonContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';

interface ComparisonContextType {
  comparisonList: string[];
  addToComparison: (productId: string) => void;
  removeFromComparison: (productId: string) => void;
  clearComparison: () => void;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [comparisonList, setComparisonList] = useState<string[]>(() => {
    const storedList = localStorage.getItem('comparisonList');
    return storedList ? JSON.parse(storedList) : [];
  });

  useEffect(() => {
    localStorage.setItem('comparisonList', JSON.stringify(comparisonList));
  }, [comparisonList]);

  const addToComparison = (productId: string) => {
    setComparisonList(prevList => {
      if (prevList.includes(productId)) return prevList;
      return [...prevList, productId];
    });
  };

  const removeFromComparison = (productId: string) => {
    setComparisonList(prevList => prevList.filter(id => id !== productId));
  };

  const clearComparison = () => {
    setComparisonList([]);
  };

  return (
    <ComparisonContext.Provider value={{ comparisonList, addToComparison, removeFromComparison, clearComparison }}>
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
};
