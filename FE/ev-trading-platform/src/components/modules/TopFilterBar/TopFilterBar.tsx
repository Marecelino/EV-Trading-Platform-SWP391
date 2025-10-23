// src/components/modules/TopFilterBar/TopFilterBar.tsx
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import './TopFilterBar.scss';
import brandApi from '../../../api/brandApi';
import categoryApi from '../../../api/categoryApi';
import { Brand, Category } from '../../../types';

export interface Filters {
  category: string;
  searchTerm?: string;
  brand?: string;
  year_of_manufacture?: number;
 
}

interface TopFilterBarProps {
  filters: Filters;
  onFilterChange: (newFilters: Partial<Filters>) => void;
}

const TopFilterBar: React.FC<TopFilterBarProps> = ({ filters, onFilterChange }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [brandsResponse, categoriesResponse] = await Promise.all([
          brandApi.getActiveBrands(),
          categoryApi.getActiveCategories(),
        ]);
        if (brandsResponse.data) {
          setBrands(brandsResponse.data);
        }
        if (categoriesResponse.data) {
          setCategories(categoriesResponse.data);
        }
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      }
    };
    fetchInitialData();
  }, []);

  return (
    <div className="top-filter-bar content-card">
      
      <div className="filter-row">
        <div className="category-selector">
          {categories.map(cat => (
            <button
              key={cat._id}
              className={filters.category === cat.slug ? 'active' : ''}
              onClick={() => onFilterChange({ category: cat.slug })}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <div className="search-input">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo từ khóa..."
            onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
          />
        </div>
      </div>

      {/* === HÀNG 2: CÁC BỘ LỌC CHI TIẾT (THAY ĐỔI ĐỘNG) === */}
      <div className="filter-row detailed-filters">
        
        <select onChange={(e) => onFilterChange({ brand: e.target.value })}>
          <option value="">Tất cả các hãng</option>
          {brands.map(brand => (
            <option key={brand._id} value={brand._id}>{brand.name}</option>
          ))}
        </select>

        
        {filters.category === 'xe-dien' && (
          <>
            <select onChange={(e) => onFilterChange({ year_of_manufacture: parseInt(e.target.value) || undefined })}>
              <option value="">Năm sản xuất</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>
           
          </>
        )}

        
        {filters.category === 'pin-xe-dien' && (
           <>
             <select>
              <option value="">Tình trạng pin</option>
              <option value="95">Trên 95%</option>
              <option value="90">Trên 90%</option>
            </select>
            
           </>
        )}
      </div>
    </div>
  );
};

export default TopFilterBar;