// src/components/modules/SidebarFilter/SidebarFilter.tsx
import React from 'react';
import type { Filters } from '../TopFilterBar/TopFilterBar';
import './SidebarFilter.scss';

interface SidebarFilterProps {
  filters?: Filters;
  onFilterChange?: (newFilters: Partial<Filters>) => void;
}

const SidebarFilter: React.FC<SidebarFilterProps> = ({ filters, onFilterChange }) => {
  // Note: Price range, SOH, and mileage filters would need backend API support
  // For now, these are UI-only and would need to be implemented client-side
  // or added to SearchListingsParams if backend supports them

  const handlePriceRangeChange = (min: string, max: string) => {
    // TODO: Add price range to filters when backend supports it
    // For now, this is a placeholder
    if (onFilterChange) {
      // Client-side filtering could be done here if needed
      console.log("Price range filter:", { min, max });
    }
  };

  return (
    <aside className="sidebar-filter">
      <h4>Bộ lọc chi tiết</h4>
      
      <div className="filter-group">
        <label>Khoảng giá (VND)</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="number" 
            placeholder="Giá từ" 
            min={0}
            onChange={(e) => {
              if (onFilterChange && e.target.value) {
                handlePriceRangeChange(e.target.value, filters?.priceMax || '');
              }
            }}
          />
          <input 
            type="number" 
            placeholder="Giá đến" 
            min={0}
            onChange={(e) => {
              if (onFilterChange && e.target.value) {
                handlePriceRangeChange(filters?.priceMin || '', e.target.value);
              }
            }}
          />
        </div>
        <small style={{ fontSize: '12px', color: '#666' }}>
          Lưu ý: Bộ lọc giá hiện chưa được hỗ trợ bởi API
        </small>
      </div>

      {/* SOH filter for batteries */}
      {filters?.category === 'pin-xe-dien' && (
        <div className="filter-group">
          <label>Tình trạng pin (%)</label>
          <input 
            type="range" 
            min={0} 
            max={100} 
            step={5}
            defaultValue={80}
            style={{ width: '100%' }}
          />
          <small style={{ fontSize: '12px', color: '#666' }}>
            Lưu ý: Bộ lọc SOH hiện chưa được hỗ trợ bởi API
          </small>
        </div>
      )}

      {/* Mileage filter for EVs */}
      {filters?.category === 'xe-dien' && (
        <div className="filter-group">
          <label>Số km đã đi</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="number" 
              placeholder="Từ (km)" 
              min={0}
            />
            <input 
              type="number" 
              placeholder="Đến (km)" 
              min={0}
            />
          </div>
          <small style={{ fontSize: '12px', color: '#666' }}>
            Lưu ý: Bộ lọc số km hiện chưa được hỗ trợ bởi API
          </small>
        </div>
      )}

      <button 
        className="apply-filter-btn"
        onClick={() => {
          // Apply filters - triggers parent component to refetch
          if (onFilterChange) {
            onFilterChange({}); // This will trigger useEffect in parent
          }
        }}
      >
        Áp dụng
      </button>
    </aside>
  );
};

export default SidebarFilter;