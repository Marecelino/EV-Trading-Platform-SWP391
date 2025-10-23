// src/pages/AdminBrandManagementPage/AdminBrandManagementPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import brandApi from '../../api/brandApi';
import type { Brand } from '../../types';
import './AdminBrandManagementPage.scss';
import Pagination from '../../components/common/Pagination/Pagination';

const AdminBrandManagementPage: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const ITEMS_PER_PAGE = 5;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo_url: '',
    country: '',
    is_active: true
  });

  const fetchBrands = useCallback(() => {
    setIsLoading(true);
    console.log("=== FETCHING BRANDS ===");
    
    brandApi.getBrands().then(response => {
      console.log("=== BRANDS API RESPONSE ===");
      console.log("Full response:", response);
      console.log("Response data:", response.data);
      
      if (Array.isArray(response.data)) {
        setBrands(response.data);
        console.log(`Loaded ${response.data.length} brands`);
      } else {
        console.warn("No valid brands data found in response");
        setBrands([]);
      }
    }).catch(error => {
      console.error("Error fetching brands:", error);
      setBrands([]);
    }).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Calculate pagination
  const totalPages = Math.ceil(brands.length / ITEMS_PER_PAGE);
  const startIndex = (pagination.currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const displayedBrands = brands.slice(startIndex, endIndex);

  // Update pagination when brands change
  useEffect(() => {
    setPagination(prev => ({ 
      ...prev, 
      totalPages: totalPages,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage
    }));
  }, [totalPages]);

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
        console.log("Brand updated successfully");
      } else {
        await brandApi.createBrand(formData);
        console.log("Brand created successfully");
      }
      
      setIsModalOpen(false);
      fetchBrands();
    } catch (error) {
      console.error("Error saving brand:", error);
      alert('Có lỗi xảy ra khi lưu thương hiệu');
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thương hiệu này?')) {
      return;
    }

    try {
      await brandApi.deleteBrand(id);
      console.log("Brand deleted successfully");
      fetchBrands();
    } catch (error) {
      console.error("Error deleting brand:", error);
      alert('Có lỗi xảy ra khi xóa thương hiệu');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await brandApi.toggleActive(id);
      console.log("Brand status toggled successfully");
      fetchBrands();
    } catch (error) {
      console.error("Error toggling brand status:", error);
      alert('Có lỗi xảy ra khi thay đổi trạng thái thương hiệu');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Quản lý thương hiệu</h1>
        <button className="btn btn--primary" onClick={handleCreateBrand}>
          Thêm thương hiệu mới
        </button>
      </div>

      {/* Debug Info */}
      <div className="debug-info" style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h4>Debug Info:</h4>
        <p>Đang hiển thị {displayedBrands.length} thương hiệu (tổng {brands.length})</p>
        <p>Trang hiện tại: {pagination.currentPage} / {totalPages}</p>
        <p><strong>Lưu ý:</strong> Kiểm tra Console để xem chi tiết API responses.</p>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Tên thương hiệu</th>
              <th>Mô tả</th>
              <th>Quốc gia</th>
              <th>Số tin đăng</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Đang tải dữ liệu...</td></tr>
            ) : displayedBrands.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Không có thương hiệu nào.</td></tr>
            ) : (
              displayedBrands.map(brand => (
                <tr key={brand._id}>
                  <td>
                    {brand.logo_url ? (
                      <img src={brand.logo_url} alt={brand.name} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>
                        {brand.name.charAt(0)}
                      </div>
                    )}
                  </td>
                  <td>{brand.name}</td>
                  <td>{brand.description || 'N/A'}</td>
                  <td>{brand.country || 'N/A'}</td>
                  <td>{brand.listing_count}</td>
                  <td>
                    <span className={`status-badge status--${brand.is_active ? 'active' : 'inactive'}`}>
                      {brand.is_active ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      <button
                        className="action-btn btn--edit"
                        onClick={() => handleEditBrand(brand)}
                        style={{ fontSize: '11px', padding: '3px 6px' }}
                      >
                        Sửa
                      </button>
                      <button
                        className={`action-btn ${brand.is_active ? 'btn--deactivate' : 'btn--activate'}`}
                        onClick={() => handleToggleActive(brand._id)}
                        style={{ fontSize: '11px', padding: '3px 6px' }}
                      >
                        {brand.is_active ? 'Tắt' : 'Bật'}
                      </button>
                      <button
                        className="action-btn btn--delete"
                        onClick={() => handleDeleteBrand(brand._id)}
                        style={{ 
                          fontSize: '11px', 
                          padding: '3px 6px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px'
                        }}
                      >
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

      <Pagination 
        currentPage={pagination.currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setPagination(prev => ({...prev, currentPage: page}))}
      />

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{editingBrand ? 'Sửa thương hiệu' : 'Thêm thương hiệu mới'}</h3>
              <button className="modal__close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal__body">
              <div className="form-group">
                <label>Tên thương hiệu *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>URL Logo</label>
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Quốc gia</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  Hoạt động
                </label>
              </div>
              <div className="modal__footer">
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
