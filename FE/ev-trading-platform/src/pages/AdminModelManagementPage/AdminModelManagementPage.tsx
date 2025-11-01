// src/pages/AdminModelManagementPage/AdminModelManagementPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import modelApi from '../../api/modelApi';
import brandApi from '../../api/brandApi';
import type { Model, Brand } from '../../types';
import './AdminModelManagementPage.scss';
import Pagination from '../../components/common/Pagination/Pagination';

const AdminModelManagementPage: React.FC = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const ITEMS_PER_PAGE = 5;

  const [formData, setFormData] = useState({
    brand_name: '',
    name: '',
    description: '',
    year: new Date().getFullYear(),
    year_start: new Date().getFullYear(),
    year_end: new Date().getFullYear(),
    body_type: '',
    drivetrain: '',
    is_active: true,
    battery_capacity: 0,
    range: 0,
    charging_time: 0,
    motor_power: 0,
    top_speed: 0
  });

  // CRITICAL FIX: Improve response parsing to handle multiple structures consistently
  const fetchModels = useCallback(() => {
    setIsLoading(true);
    console.log("=== FETCHING MODELS ===");
    
    modelApi.getModels().then(response => {
      console.log("=== MODELS API RESPONSE ===");
      console.log("Full response:", response);
      console.log("Response data:", response.data);
      
      // Handle both direct array and nested response structures
      let modelsData: Model[] = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        modelsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        modelsData = response.data;
      }
      
      setModels(modelsData);
      console.log(`Loaded ${modelsData.length} models`);
    }).catch(error => {
      console.error("Error fetching models:", error);
      setModels([]);
    }).finally(() => setIsLoading(false));
  }, []);

  // CRITICAL FIX: Improve response parsing for brands
  const fetchBrands = useCallback(() => {
    brandApi.getBrands().then(response => {
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
    });
  }, []);

  useEffect(() => {
    fetchModels();
    fetchBrands();
  }, [fetchModels, fetchBrands]);

  // Calculate pagination
  const totalPages = Math.ceil(models.length / ITEMS_PER_PAGE);
  const startIndex = (pagination.currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const displayedModels = models.slice(startIndex, endIndex);

  // Update pagination when models change
  useEffect(() => {
    setPagination(prev => ({ 
      ...prev, 
      totalPages: totalPages,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage
    }));
  }, [totalPages]);

  const handleCreateModel = () => {
    setEditingModel(null);
    setFormData({
      brand_name: '',
      name: '',
      description: '',
      year: new Date().getFullYear(),
      year_start: new Date().getFullYear(),
      year_end: new Date().getFullYear(),
      body_type: '',
      drivetrain: '',
      is_active: true,
      battery_capacity: 0,
      range: 0,
      charging_time: 0,
      motor_power: 0,
      top_speed: 0
    });
    setIsModalOpen(true);
  };

  const handleEditModel = (model: Model) => {
    setEditingModel(model);
    const brandName = typeof model.brand_id === 'object' ? model.brand_id.name : '';
    setFormData({
      brand_name: brandName,
      name: model.name,
      description: model.description,
      year: model.year,
      year_start: model.year_start || model.year,
      year_end: model.year_end || model.year,
      body_type: model.body_type || '',
      drivetrain: model.drivetrain || '',
      is_active: model.is_active,
      battery_capacity: model.battery_capacity || 0,
      range: model.range || 0,
      charging_time: model.charging_time || 0,
      motor_power: model.motor_power || 0,
      top_speed: model.top_speed || 0
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingModel) {
        await modelApi.updateModel(editingModel._id, formData);
        console.log("Model updated successfully");
      } else {
        await modelApi.createModel(formData);
        console.log("Model created successfully");
      }
      
      setIsModalOpen(false);
      fetchModels();
    } catch (error) {
      console.error("Error saving model:", error);
      alert('Có lỗi xảy ra khi lưu mẫu xe');
    }
  };

  const handleDeleteModel = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mẫu xe này?')) {
      return;
    }

    try {
      await modelApi.deleteModel(id);
      console.log("Model deleted successfully");
      fetchModels();
    } catch (error) {
      console.error("Error deleting model:", error);
      alert('Có lỗi xảy ra khi xóa mẫu xe');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Quản lý mẫu xe</h1>
        <button className="btn btn--primary" onClick={handleCreateModel}>
          Thêm mẫu xe mới
        </button>
      </div>

      {/* Debug Info */}
      <div className="debug-info" style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h4>Debug Info:</h4>
        <p>Đang hiển thị {displayedModels.length} mẫu xe (tổng {models.length})</p>
        <p>Trang hiện tại: {pagination.currentPage} / {totalPages}</p>
        <p><strong>Lưu ý:</strong> Kiểm tra Console để xem chi tiết API responses.</p>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Thương hiệu</th>
              <th>Tên mẫu xe</th>
              <th>Năm</th>
              <th>Mô tả</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Đang tải dữ liệu...</td></tr>
            ) : displayedModels.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Không có mẫu xe nào.</td></tr>
            ) : (
              displayedModels.map(model => (
                <tr key={model._id}>
                  <td>
                    {typeof model.brand_id === 'object' ? model.brand_id.name : 'N/A'}
                  </td>
                  <td>{model.name}</td>
                  <td>{model.year}</td>
                  <td>{model.description}</td>
                  <td>
                    <span className={`status-badge status--${model.is_active ? 'active' : 'inactive'}`}>
                      {model.is_active ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      <button
                        className="action-btn btn--edit"
                        onClick={() => handleEditModel(model)}
                        style={{ fontSize: '11px', padding: '3px 6px' }}
                      >
                        Sửa
                      </button>
                      <button
                        className="action-btn btn--delete"
                        onClick={() => handleDeleteModel(model._id)}
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
          <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{editingModel ? 'Sửa mẫu xe' : 'Thêm mẫu xe mới'}</h3>
              <button className="modal__close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal__body">
              <div className="form-row">
                <div className="form-group">
                  <label>Thương hiệu *</label>
                  <select
                    value={formData.brand_name}
                    onChange={(e) => setFormData({...formData, brand_name: e.target.value})}
                    required
                  >
                    <option value="">Chọn thương hiệu</option>
                    {brands.map(brand => (
                      <option key={brand._id} value={brand.name}>{brand.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Tên mẫu xe *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Năm sản xuất</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                    min="1900"
                    max="2030"
                  />
                </div>
                <div className="form-group">
                  <label>Năm bắt đầu</label>
                  <input
                    type="number"
                    value={formData.year_start}
                    onChange={(e) => setFormData({...formData, year_start: parseInt(e.target.value)})}
                    min="1900"
                    max="2030"
                  />
                </div>
                <div className="form-group">
                  <label>Năm kết thúc</label>
                  <input
                    type="number"
                    value={formData.year_end}
                    onChange={(e) => setFormData({...formData, year_end: parseInt(e.target.value)})}
                    min="1900"
                    max="2030"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Loại thân xe</label>
                  <input
                    type="text"
                    value={formData.body_type}
                    onChange={(e) => setFormData({...formData, body_type: e.target.value})}
                    placeholder="Sedan, SUV, Hatchback..."
                  />
                </div>
                <div className="form-group">
                  <label>Hệ dẫn động</label>
                  <input
                    type="text"
                    value={formData.drivetrain}
                    onChange={(e) => setFormData({...formData, drivetrain: e.target.value})}
                    placeholder="FWD, RWD, AWD..."
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Dung lượng pin (kWh)</label>
                  <input
                    type="number"
                    value={formData.battery_capacity}
                    onChange={(e) => setFormData({...formData, battery_capacity: parseFloat(e.target.value)})}
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label>Tầm hoạt động (km)</label>
                  <input
                    type="number"
                    value={formData.range}
                    onChange={(e) => setFormData({...formData, range: parseInt(e.target.value)})}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Thời gian sạc (giờ)</label>
                  <input
                    type="number"
                    value={formData.charging_time}
                    onChange={(e) => setFormData({...formData, charging_time: parseFloat(e.target.value)})}
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Công suất động cơ (kW)</label>
                  <input
                    type="number"
                    value={formData.motor_power}
                    onChange={(e) => setFormData({...formData, motor_power: parseInt(e.target.value)})}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Tốc độ tối đa (km/h)</label>
                  <input
                    type="number"
                    value={formData.top_speed}
                    onChange={(e) => setFormData({...formData, top_speed: parseInt(e.target.value)})}
                    min="0"
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
              </div>

              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn--primary">
                  {editingModel ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModelManagementPage;
