// src/components/modules/SidebarFilter/SidebarFilter.tsx
import React from 'react';
import './SidebarFilter.scss';

const SidebarFilter: React.FC = () => {
  return (
    <aside className="sidebar-filter">
      <h4>Bộ lọc chi tiết</h4>
      
      <div className="filter-group">
        <label>Khoảng giá</label>
        {/* Thêm slider hoặc input cho khoảng giá ở đây */}
        <input type="text" placeholder="Giá từ" />
        <input type="text" placeholder="Giá đến" />
      </div>

      <div className="filter-group">
        <label>Tình trạng pin (%)</label>
        {/* Thêm slider hoặc input cho tình trạng pin */}
      </div>

      <div className="filter-group">
        <label>Số km đã đi</label>
        {/* Thêm slider hoặc input cho số km */}
      </div>

      <button className="apply-filter-btn">Áp dụng</button>
    </aside>
  );
};

export default SidebarFilter;