// src/pages/AdminBrandManagementPage/AdminBrandManagementPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Package, TrendingUp, XCircle, Edit2, Trash2, ToggleLeft, ToggleRight, Plus, Search, Filter as FilterIcon } from 'lucide-react';
import brandApi from '../../api/brandApi';
import type { Brand } from '../../types';
import { toast } from 'react-toastify';
import './AdminBrandManagementPage.scss';
import Pagination from '../../components/common/Pagination/Pagination';

const AdminBrandManagementPage: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const ITEMS_PER_PAGE = 10;

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'country' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Row selection state
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo_url: '',
    country: '',
    is_active: true
  });

  // Calculate brand stats
  const brandStats = useMemo(() => ({
    total: brands.length,
    active: brands.filter(b => b.is_active).length,
    inactive: brands.filter(b => !b.is_active).length
  }), [brands]);

  // Filter and sort brands
  const filteredBrands = useMemo(() => {
    let filtered = brands.filter(brand => {
      const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            brand.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            brand.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'active' && brand.is_active) ||
                            (statusFilter === 'inactive' && !brand.is_active);
      return matchesSearch && matchesStatus;
    });

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: string | number = '';
        let bValue: string | number = '';

        if (sortField === 'name') {
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
        } else if (sortField === 'country') {
          aValue = (a.country || '').toLowerCase();
          bValue = (b.country || '').toLowerCase();
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [brands, searchQuery, statusFilter, sortField, sortDirection]);

  const fetchBrands = useCallback(() => {
    setIsLoading(true);
    console.log("=== FETCHING BRANDS ===");
    
    brandApi.getBrands().then(response => {
      console.log("=== BRANDS API RESPONSE ===");
      console.log("Full response:", response);
      console.log("Response data:", response.data);
      
      // Handle both direct array and nested response structures
      let brandsData: Brand[] = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        brandsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        brandsData = response.data;
      }
      
      setBrands(brandsData);
      console.log(`Loaded ${brandsData.length} brands`);
    }).catch(error => {
      console.error("Error fetching brands:", error);
      setBrands([]);
    }).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Calculate pagination from filtered brands
  const totalPages = Math.ceil(filteredBrands.length / ITEMS_PER_PAGE);
  const startIndex = (pagination.currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const displayedBrands = filteredBrands.slice(startIndex, endIndex);

  // Update pagination when filtered brands change
  useEffect(() => {
    setPagination(prev => ({ 
      ...prev, 
      totalPages: totalPages,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage
    }));
  }, [totalPages]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [searchQuery, statusFilter]);

  // Sorting handler
  const handleSort = (field: 'name' | 'country') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedBrands.size === displayedBrands.length) {
      setSelectedBrands(new Set());
    } else {
      setSelectedBrands(new Set(displayedBrands.map(b => b._id)));
    }
  };

  const handleSelectBrand = (brandId: string) => {
    const newSelected = new Set(selectedBrands);
    if (newSelected.has(brandId)) {
      newSelected.delete(brandId);
    } else {
      newSelected.add(brandId);
    }
    setSelectedBrands(newSelected);
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedBrands.size === 0) return;
    
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedBrands.size} thương hiệu đã chọn?`)) {
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedBrands).map(id => brandApi.deleteBrand(id))
      );
      toast.success(`Đã xóa ${selectedBrands.size} thương hiệu thành công`);
      setSelectedBrands(new Set());
      fetchBrands();
    } catch (error) {
      console.error("Error deleting brands:", error);
      toast.error('Có lỗi xảy ra khi xóa thương hiệu');
    }
  };

  const handleBulkToggleActive = async (active: boolean) => {
    if (selectedBrands.size === 0) return;
    
    try {
      await Promise.all(
        Array.from(selectedBrands).map(id => brandApi.toggleActive(id))
      );
      toast.success(`Đã ${active ? 'bật' : 'tắt'} ${selectedBrands.size} thương hiệu thành công`);
      setSelectedBrands(new Set());
      fetchBrands();
    } catch (error) {
      console.error("Error toggling brands:", error);
      toast.error('Có lỗi xảy ra khi thay đổi trạng thái thương hiệu');
    }
  };

  const handleCreateBrand = () => {
    setEditingBrand(null);
    setFormData({
      name: '',
      description: '',
      logo_url: '',
      country: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description || '',
      logo_url: brand.logo_url || '',
      country: brand.country || '',
      is_active: brand.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingBrand) {
        await brandApi.updateBrand(editingBrand._id, formData);
        toast.success('Cập nhật thương hiệu thành công');
      } else {
        await brandApi.createBrand(formData);
        toast.success('Tạo thương hiệu mới thành công');
      }
      
      setIsModalOpen(false);
      fetchBrands();
    } catch (error) {
      console.error("Error saving brand:", error);
      toast.error('Có lỗi xảy ra khi lưu thương hiệu');
    }
  };

  const handleDeleteBrand = async (id: string, brandName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thương hiệu "${brandName}"?`)) {
      return;
    }

    try {
      await brandApi.deleteBrand(id);
      toast.success('Xóa thương hiệu thành công');
      fetchBrands();
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast.error('Có lỗi xảy ra khi xóa thương hiệu');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await brandApi.toggleActive(id);
      toast.success(`${currentStatus ? 'Tắt' : 'Bật'} thương hiệu thành công`);
      fetchBrands();
    } catch (error) {
      console.error("Error toggling brand status:", error);
      toast.error('Có lỗi xảy ra khi thay đổi trạng thái thương hiệu');
    }
  };

  return (
    <div className="admin-page">
      <h1>Quản lý thương hiệu</h1>

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card stat-card--total">
          <div className="stat-card__icon">
            <Package size={24} />
          </div>
          <div className="stat-card__content">
            <h3 className="stat-card__label">Tổng thương hiệu</h3>
            <p className="stat-card__value">{brandStats.total.toLocaleString('vi-VN')}</p>
          </div>
        </div>

        <div className="stat-card stat-card--active">
          <div className="stat-card__icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-card__content">
            <h3 className="stat-card__label">Đang hoạt động</h3>
            <p className="stat-card__value">{brandStats.active.toLocaleString('vi-VN')}</p>
          </div>
        </div>

        <div className="stat-card stat-card--inactive">
          <div className="stat-card__icon">
            <XCircle size={24} />
          </div>
          <div className="stat-card__content">
            <h3 className="stat-card__label">Không hoạt động</h3>
            <p className="stat-card__value">{brandStats.inactive.toLocaleString('vi-VN')}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-item filter-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, quốc gia, mô tả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-item filter-select">
            <FilterIcon size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>

          {(searchQuery || statusFilter !== 'all') && (
            <button
              className="btn-clear-filters"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
            >
              Xóa bộ lọc
            </button>
          )}

          <button className="btn btn--primary" onClick={handleCreateBrand}>
            <Plus size={18} />
            Thêm thương hiệu
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedBrands.size > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-actions-info">
            <span className="selected-count">{selectedBrands.size} thương hiệu đã chọn</span>
          </div>
          <div className="bulk-actions-buttons">
            <button
              className="bulk-action-btn bulk-action-btn--activate"
              onClick={() => handleBulkToggleActive(true)}
            >
              <ToggleRight size={16} />
              Bật đã chọn
            </button>
            <button
              className="bulk-action-btn bulk-action-btn--deactivate"
              onClick={() => handleBulkToggleActive(false)}
            >
              <ToggleLeft size={16} />
              Tắt đã chọn
            </button>
            <button
              className="bulk-action-btn bulk-action-btn--delete"
              onClick={handleBulkDelete}
            >
              <Trash2 size={16} />
              Xóa đã chọn
            </button>
            <button
              className="bulk-action-btn bulk-action-btn--cancel"
              onClick={() => setSelectedBrands(new Set())}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="th-checkbox">
                <input
                  type="checkbox"
                  checked={displayedBrands.length > 0 && selectedBrands.size === displayedBrands.length}
                  onChange={handleSelectAll}
                  className="checkbox-input"
                />
              </th>
              <th>Logo</th>
              <th 
                className={`sortable ${sortField === 'name' ? 'sorted' : ''}`}
                onClick={() => handleSort('name')}
              >
                <div className="th-content">
                  Tên thương hiệu
                  {sortField === 'name' && (
                    <span className="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th>Mô tả</th>
              <th 
                className={`sortable ${sortField === 'country' ? 'sorted' : ''}`}
                onClick={() => handleSort('country')}
              >
                <div className="th-content">
                  Quốc gia
                  {sortField === 'country' && (
                    <span className="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="empty-cell">
                  <div className="loading-spinner">Đang tải dữ liệu...</div>
                </td>
              </tr>
            ) : displayedBrands.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-cell">
                  <div className="empty-state">
                    <p className="empty-state-title">Không có thương hiệu nào</p>
                    <p className="empty-state-subtitle">
                      {searchQuery || statusFilter !== 'all' 
                        ? 'Thử xóa bộ lọc để xem tất cả thương hiệu'
                        : 'Hãy thêm thương hiệu mới để bắt đầu'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              displayedBrands.map(brand => (
                <tr 
                  key={brand._id}
                  className={selectedBrands.has(brand._id) ? 'row-selected' : ''}
                >
                  <td className="td-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedBrands.has(brand._id)}
                      onChange={() => handleSelectBrand(brand._id)}
                      className="checkbox-input"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td>
                    <div className="logo-cell">
                      {brand.logo_url ? (
                        <img src={brand.logo_url} alt={brand.name} className="brand-logo" />
                      ) : (
                        <div className="brand-logo-placeholder">
                          {brand.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <strong>{brand.name}</strong>
                  </td>
                  <td>
                    <span className="description-text">
                      {brand.description || 'N/A'}
                    </span>
                  </td>
                  <td>{brand.country || 'N/A'}</td>
                  <td>
                    <span className={`status-badge status--${brand.is_active ? 'active' : 'inactive'}`}>
                      {brand.is_active ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="action-btn btn--edit"
                        onClick={() => handleEditBrand(brand)}
                        title="Sửa thương hiệu"
                      >
                        <Edit2 size={14} />
                        Sửa
                      </button>
                      <button
                        className={`action-btn ${brand.is_active ? 'btn--deactivate' : 'btn--activate'}`}
                        onClick={() => handleToggleActive(brand._id, brand.is_active)}
                        title={brand.is_active ? 'Tắt thương hiệu' : 'Bật thương hiệu'}
                      >
                        {brand.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        {brand.is_active ? 'Tắt' : 'Bật'}
                      </button>
                      <button
                        className="action-btn btn--delete"
                        onClick={() => handleDeleteBrand(brand._id, brand.name)}
                        title="Xóa thương hiệu"
                      >
                        <Trash2 size={14} />
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && filteredBrands.length > 0 && (
        <div className="pagination-wrapper">
          <Pagination 
            currentPage={pagination.currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setPagination(prev => ({...prev, currentPage: page}))}
          />
          <div className="pagination-info">
            Hiển thị {displayedBrands.length} / {filteredBrands.length} thương hiệu (Trang {pagination.currentPage} / {totalPages})
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBrand ? 'Sửa thương hiệu' : 'Thêm thương hiệu mới'}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Tên thương hiệu *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Nhập tên thương hiệu..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Nhập mô tả về thương hiệu..."
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>URL Logo</label>
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                  placeholder="https://example.com/logo.png"
                />
                {formData.logo_url && (
                  <div className="logo-preview">
                    <img src={formData.logo_url} alt="Logo preview" onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }} />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Quốc gia</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  placeholder="VD: Việt Nam, Hoa Kỳ, Nhật Bản..."
                />
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  <span>Kích hoạt thương hiệu ngay</span>
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn--secondary" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn--primary">
                  {editingBrand ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBrandManagementPage;
