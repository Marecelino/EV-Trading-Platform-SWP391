// src/components/modules/TopFilterBar/TopFilterBar.tsx
import React from 'react';
import { Search } from 'lucide-react';
import './TopFilterBar.scss';

export interface Filters {
  category: 'ev' | 'battery';
  searchTerm?: string;
  brand?: string;
  year_of_manufacture?: number;
 
}

interface TopFilterBarProps {
  filters: Filters;
  onFilterChange: (newFilters: Partial<Filters>) => void;
}

const TopFilterBar: React.FC<TopFilterBarProps> = ({ filters, onFilterChange }) => {
  return (
    <div className="top-filter-bar content-card">
      
      <div className="filter-row">
        <div className="category-selector">
          <button
            className={filters.category === 'ev' ? 'active' : ''}
            onClick={() => onFilterChange({ category: 'ev' })}
          >
            Xe điện
          </button>
          <button
            className={filters.category === 'battery' ? 'active' : ''}
            onClick={() => onFilterChange({ category: 'battery' })}
          >
            Pin
          </button>
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
          <option value="vinfast">VinFast</option>
          <option value="tesla">Tesla</option>
          <option value="kia">Kia</option>
          <option value="lg">LG</option>
        </select>

        
        {filters.category === 'ev' && (
          <>
            <select onChange={(e) => onFilterChange({ year_of_manufacture: parseInt(e.target.value) || undefined })}>
              <option value="">Năm sản xuất</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>
           
          </>
        )}

        
        {filters.category === 'battery' && (
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