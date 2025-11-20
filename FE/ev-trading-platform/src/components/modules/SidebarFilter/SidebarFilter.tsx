// src/components/modules/SidebarFilter/SidebarFilter.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Filters } from '../TopFilterBar/TopFilterBar';
import './SidebarFilter.scss';

interface SidebarFilterProps {
  filters: Filters;
  onFilterChange: (newFilters: Partial<Filters>) => void;
}

const SidebarFilter: React.FC<SidebarFilterProps> = ({ filters, onFilterChange }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['price', 'condition', 'location'])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000000) return `${(price / 1000000000).toFixed(1)}tỷ`;
    if (price >= 1000000) return `${(price / 1000000).toFixed(0)}tr`;
    return price.toLocaleString('vi-VN');
  };

  // Price ranges for quick filters
  const priceRanges = [
    { label: 'Dưới 500 triệu', min: 0, max: 500000000 },
    { label: '500tr - 800tr', min: 500000000, max: 800000000 },
    { label: '800tr - 1 tỷ', min: 800000000, max: 1000000000 },
    { label: '1 tỷ - 1.5 tỷ', min: 1000000000, max: 1500000000 },
    { label: '1.5 tỷ - 2 tỷ', min: 1500000000, max: 2000000000 },
    { label: 'Trên 2 tỷ', min: 2000000000, max: 10000000000 },
  ];

  const mileageRanges = [
    { label: 'Dưới 10,000 km', min: 0, max: 10000 },
    { label: '10,000 - 30,000 km', min: 10000, max: 30000 },
    { label: '30,000 - 50,000 km', min: 30000, max: 50000 },
    { label: '50,000 - 100,000 km', min: 50000, max: 100000 },
    { label: 'Trên 100,000 km', min: 100000, max: 1000000 },
  ];

  const rangeOptions = [
    { label: 'Dưới 300 km', min: 0, max: 300 },
    { label: '300 - 400 km', min: 300, max: 400 },
    { label: '400 - 500 km', min: 400, max: 500 },
    { label: '500 - 600 km', min: 500, max: 600 },
    { label: 'Trên 600 km', min: 600, max: 10000 },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - i);

  return (
    <aside className="sidebar-filter">
      <div className="filter-header">
        <h3>Bộ lọc</h3>
      </div>

      {/* CONDITION FILTER */}
      <div className="filter-section">
        <button 
          className="section-header"
          onClick={() => toggleSection('condition')}
        >
          <span>Tình trạng</span>
          {expandedSections.has('condition') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {expandedSections.has('condition') && (
          <div className="section-content">
            {['new', 'like_new', 'excellent', 'good', 'fair', 'poor'].map(cond => (
              <label key={cond} className="checkbox-label">
                <input
                  type="radio"
                  name="condition"
                  checked={filters.condition === cond}
                  onChange={() => onFilterChange({ 
                    condition: filters.condition === cond ? undefined : cond
                  })}
                />
                <span>{getConditionText(cond)}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* PRICE FILTER */}
      <div className="filter-section">
        <button 
          className="section-header"
          onClick={() => toggleSection('price')}
        >
          <span>Khoảng giá</span>
          {expandedSections.has('price') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {expandedSections.has('price') && (
          <div className="section-content">
            {/* Quick price filters */}
            <div className="quick-filters">
              {priceRanges.map((range, idx) => {
                const isActive = filters.minPrice === range.min && filters.maxPrice === range.max;
                return (
                  <button
                    key={idx}
                    className={`quick-filter-btn ${isActive ? 'active' : ''}`}
                    onClick={() => onFilterChange({ 
                      minPrice: isActive ? undefined : range.min, 
                      maxPrice: isActive ? undefined : range.max 
                    })}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>

            {/* Custom price range */}
            <div className="custom-range">
              <div className="range-inputs">
                <input
                  type="number"
                  placeholder="Giá từ"
                  value={filters.minPrice || ''}
                  onChange={(e) => onFilterChange({ 
                    minPrice: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Giá đến"
                  value={filters.maxPrice || ''}
                  onChange={(e) => onFilterChange({ 
                    maxPrice: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                />
              </div>
              {(filters.minPrice || filters.maxPrice) && (
                <div className="range-display">
                  {formatPrice(filters.minPrice || 0)} - {formatPrice(filters.maxPrice || 10000000000)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* LOCATION FILTER */}
      <div className="filter-section">
        <button 
          className="section-header"
          onClick={() => toggleSection('location')}
        >
          <span>Địa điểm</span>
          {expandedSections.has('location') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {expandedSections.has('location') && (
          <div className="section-content">
            <select
              className="location-select"
              value={filters.location || ''}
              onChange={(e) => onFilterChange({ location: e.target.value || undefined })}
            >
              <option value="">Tất cả địa điểm</option>
              <option value="Tp Hồ Chí Minh">Tp Hồ Chí Minh</option>
              <option value="Hà Nội">Hà Nội</option>
              <option value="Đà Nẵng">Đà Nẵng</option>
              <option value="Cần Thơ">Cần Thơ</option>
              <option value="Bình Dương">Bình Dương</option>
            </select>
          </div>
        )}
      </div>

      {/* EV-SPECIFIC FILTERS */}
      {filters.category === 'xe-dien' && (
        <>
          {/* YEAR FILTER */}
          <div className="filter-section">
            <button 
              className="section-header"
              onClick={() => toggleSection('year')}
            >
              <span>Năm sản xuất</span>
              {expandedSections.has('year') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {expandedSections.has('year') && (
              <div className="section-content">
                <div className="range-selects">
                  <select
                    value={filters.minYear || ''}
                    onChange={(e) => onFilterChange({ 
                      minYear: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                  >
                    <option value="">Từ</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <span>-</span>
                  <select
                    value={filters.maxYear || ''}
                    onChange={(e) => onFilterChange({ 
                      maxYear: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                  >
                    <option value="">Đến</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* MILEAGE FILTER */}
          <div className="filter-section">
            <button 
              className="section-header"
              onClick={() => toggleSection('mileage')}
            >
              <span>Số km đã đi</span>
              {expandedSections.has('mileage') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {expandedSections.has('mileage') && (
              <div className="section-content">
                <div className="quick-filters">
                  {mileageRanges.map((range, idx) => {
                    const isActive = filters.minMileage === range.min && filters.maxMileage === range.max;
                    return (
                      <button
                        key={idx}
                        className={`quick-filter-btn ${isActive ? 'active' : ''}`}
                        onClick={() => onFilterChange({ 
                          minMileage: isActive ? undefined : range.min, 
                          maxMileage: isActive ? undefined : range.max 
                        })}
                      >
                        {range.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* BATTERY CAPACITY */}
          <div className="filter-section">
            <button 
              className="section-header"
              onClick={() => toggleSection('capacity')}
            >
              <span>Dung lượng pin (kWh)</span>
              {expandedSections.has('capacity') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {expandedSections.has('capacity') && (
              <div className="section-content">
                <div className="range-inputs">
                  <input
                    type="number"
                    placeholder="Từ"
                    value={filters.minCapacity || ''}
                    onChange={(e) => onFilterChange({ 
                      minCapacity: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Đến"
                    value={filters.maxCapacity || ''}
                    onChange={(e) => onFilterChange({ 
                      maxCapacity: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* RANGE FILTER */}
          <div className="filter-section">
            <button 
              className="section-header"
              onClick={() => toggleSection('range')}
            >
              <span>Quãng đường (km)</span>
              {expandedSections.has('range') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {expandedSections.has('range') && (
              <div className="section-content">
                <div className="quick-filters">
                  {rangeOptions.map((range, idx) => {
                    const isActive = filters.minRange === range.min && filters.maxRange === range.max;
                    return (
                      <button
                        key={idx}
                        className={`quick-filter-btn ${isActive ? 'active' : ''}`}
                        onClick={() => onFilterChange({ 
                          minRange: isActive ? undefined : range.min, 
                          maxRange: isActive ? undefined : range.max 
                        })}
                      >
                        {range.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* BATTERY-SPECIFIC FILTERS */}
      {filters.category === 'pin-xe-dien' && (
        <div className="filter-section">
          <button 
            className="section-header"
            onClick={() => toggleSection('soh')}
          >
            <span>Tình trạng pin (SOH %)</span>
            {expandedSections.has('soh') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {expandedSections.has('soh') && (
            <div className="section-content">
              <div className="quick-filters">
                <button
                  className={`quick-filter-btn ${filters.minSoh === 90 && filters.maxSoh === 100 ? 'active' : ''}`}
                  onClick={() => {
                    const isActive = filters.minSoh === 90 && filters.maxSoh === 100;
                    onFilterChange({ minSoh: isActive ? undefined : 90, maxSoh: isActive ? undefined : 100 });
                  }}
                >
                  90-100% (Tốt)
                </button>
                <button
                  className={`quick-filter-btn ${filters.minSoh === 80 && filters.maxSoh === 89 ? 'active' : ''}`}
                  onClick={() => {
                    const isActive = filters.minSoh === 80 && filters.maxSoh === 89;
                    onFilterChange({ minSoh: isActive ? undefined : 80, maxSoh: isActive ? undefined : 89 });
                  }}
                >
                  80-89% (Khá)
                </button>
                <button
                  className={`quick-filter-btn ${filters.minSoh === 70 && filters.maxSoh === 79 ? 'active' : ''}`}
                  onClick={() => {
                    const isActive = filters.minSoh === 70 && filters.maxSoh === 79;
                    onFilterChange({ minSoh: isActive ? undefined : 70, maxSoh: isActive ? undefined : 79 });
                  }}
                >
                  70-79% (Trung bình)
                </button>
                <button
                  className={`quick-filter-btn ${filters.minSoh === 0 && filters.maxSoh === 69 ? 'active' : ''}`}
                  onClick={() => {
                    const isActive = filters.minSoh === 0 && filters.maxSoh === 69;
                    onFilterChange({ minSoh: isActive ? undefined : 0, maxSoh: isActive ? undefined : 69 });
                  }}
                >
                  Dưới 70%
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      

      {/* CLEAR ALL FILTERS */}
      <button 
        className="clear-all-btn"
        onClick={() => onFilterChange({ 
          condition: undefined,
          minPrice: undefined,
          maxPrice: undefined,
          location: undefined,
          minYear: undefined,
          maxYear: undefined,
          minMileage: undefined,
          maxMileage: undefined,
          minCapacity: undefined,
          maxCapacity: undefined,
          minRange: undefined,
          maxRange: undefined,
          minSoh: undefined,
          maxSoh: undefined,
          is_verified: undefined,
          is_featured: undefined,
        })}
      >
        Xóa tất cả bộ lọc
      </button>
    </aside>
  );
};

// Helper function
function getConditionText(condition: string): string {
  const map: Record<string, string> = {
    new: 'Mới 100%',
    like_new: 'Như mới',
    excellent: 'Tuyệt vời',
    good: 'Tốt',
    fair: 'Khá',
    poor: 'Trung bình',
  };
  return map[condition] || condition;
}

export default SidebarFilter;
