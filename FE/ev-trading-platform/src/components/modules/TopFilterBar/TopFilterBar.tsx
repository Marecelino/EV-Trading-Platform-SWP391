// src/components/modules/TopFilterBar/TopFilterBar.tsx
import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import './TopFilterBar.scss';
import brandApi from '../../../api/brandApi';
import { Brand } from '../../../types';

export interface Filters {
  category: string;
  searchTerm?: string;
  brand?: string;
  model?: string;
  year_of_manufacture?: number;
  // NEW FILTERS
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  minCapacity?: number;
  maxCapacity?: number;
  minRange?: number;
  maxRange?: number;
  minSoh?: number;
  maxSoh?: number;
  is_verified?: boolean;
  is_featured?: boolean;
  sortBy?: string; // NEW: sorting
}

interface TopFilterBarProps {
  filters: Filters;
  onFilterChange: (newFilters: Partial<Filters>) => void;
}

const TopFilterBar: React.FC<TopFilterBarProps> = ({ filters, onFilterChange }) => {
  const [brands, setBrands] = useState<Brand[]>([]);

  // Fetch brands on mount
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const brandsResponse = await brandApi.getActiveBrands();
        
        // Handle both direct array and nested response structures
        let brandsData: Brand[] = [];
        if (brandsResponse.data?.data && Array.isArray(brandsResponse.data.data)) {
          brandsData = brandsResponse.data.data;
        } else if (Array.isArray(brandsResponse.data)) {
          brandsData = brandsResponse.data;
        }
        setBrands(brandsData);
      } catch (error) {
        console.error("Failed to fetch brands", error);
        setBrands([]);
      }
    };
    fetchBrands();
  }, []);

  // Handle brand change
  const handleBrandChange = (brandId: string) => {
    onFilterChange({ brand: brandId });
  };

  // Handle category toggle (EV/Battery switch)
  const handleCategoryToggle = (category: 'xe-dien' | 'pin-xe-dien') => {
    onFilterChange({ category });
  };

  // Clear search
  const handleClearSearch = () => {
    onFilterChange({ searchTerm: '' });
  };

  // Generate year options dynamically (current year - 10 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - i);

  return (
    <div className="top-filter-bar">
      {/* Row 1: Category Switch + Search (Equal width) */}
      <div className="filter-row-primary">
        {/* Category Switch Toggle */}
        <div className="category-switch">
          <button
            className={`switch-button ${filters.category === 'xe-dien' ? 'active' : ''}`}
            onClick={() => handleCategoryToggle('xe-dien')}
            type="button"
          >
            <span className="switch-label">Xe Điện</span>
          </button>
          <button
            className={`switch-button ${filters.category === 'pin-xe-dien' ? 'active' : ''}`}
            onClick={() => handleCategoryToggle('pin-xe-dien')}
            type="button"
          >
            <span className="switch-label">Pin & Phụ Kiện</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm sản phẩm..."
              value={filters.searchTerm || ''}
              onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
            />
            {filters.searchTerm && (
              <button
                className="clear-search-button"
                onClick={handleClearSearch}
                type="button"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Sort + Brand + Year Filters */}
      <div className="filter-row-secondary">
        {/* Sort Filter */}
        <div className="filter-group">
          <label className="filter-label">Sắp xếp</label>
          <select
            className="filter-select"
            value={filters.sortBy || 'createdAt_desc'}
            onChange={(e) => onFilterChange({ sortBy: e.target.value })}
          >
            <option value="createdAt_desc">Mới nhất</option>
            <option value="createdAt_asc">Cũ nhất</option>
            <option value="price_asc">Giá thấp đến cao</option>
            <option value="price_desc">Giá cao đến thấp</option>
            <option value="mileage_asc">Km ít nhất</option>
            <option value="year_desc">Năm mới nhất</option>
            <option value="range_desc">Quãng đường xa nhất</option>
            <option value="featured">Nổi bật</option>
          </select>
        </div>

        {/* Brand Filter */}
        <div className="filter-group">
          <label className="filter-label">Hãng xe</label>
          <select
            className="filter-select"
            value={filters.brand || ''}
            onChange={(e) => handleBrandChange(e.target.value)}
          >
            <option value="">Tất cả hãng</option>
            {brands.map(brand => (
              <option key={brand._id} value={brand._id}>{brand.name}</option>
            ))}
          </select>
        </div>

        {/* Year Filter - Only for EV category */}
        {filters.category === 'xe-dien' && (
          <div className="filter-group">
            <label className="filter-label">Năm sản xuất</label>
            <select
              className="filter-select"
              value={filters.year_of_manufacture || ''}
              onChange={(e) => onFilterChange({ year_of_manufacture: parseInt(e.target.value) || undefined })}
            >
              <option value="">Tất cả năm</option>
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopFilterBar;