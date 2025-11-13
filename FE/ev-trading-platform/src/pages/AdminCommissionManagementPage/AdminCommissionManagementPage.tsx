// src/pages/AdminReviewManagementPage/AdminReviewManagementPage.tsx
import React, { useEffect, useState } from 'react';
import { Settings, DollarSign, Percent, TrendingUp, Save, RefreshCw } from 'lucide-react';
import platformSettingsApi, { PlatformSettings, UpdatePlatformSettingsDto } from '../../api/platformSettingsApi';
import { toast } from 'react-toastify';
import './AdminCommissionManagementPage.scss';

const AdminReviewManagementPage: React.FC = () => {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<UpdatePlatformSettingsDto>({
    listing_fee_amount: undefined,
    commission_default_rate: undefined,
    commission_threshold: undefined,
  });

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await platformSettingsApi.getSettings();
      setSettings(data);
      setFormData({
        listing_fee_amount: data.listing_fee_amount,
        commission_default_rate: data.commission_default_rate,
        commission_threshold: data.commission_threshold,
      });
    } catch (err: unknown) {
      console.error('Error loading platform settings:', err);
      const error = err as { response?: { data?: { message?: string }; status?: number }; message?: string };
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tải cấu hình';
      
      // Handle specific error codes
      if (error.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (error.response?.status === 403) {
        setError('Bạn không có quyền truy cập trang này.');
        toast.error('Bạn không có quyền truy cập trang này.');
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Chỉ gửi các field đã thay đổi
      const updateData: UpdatePlatformSettingsDto = {};

      if (formData.listing_fee_amount !== undefined && 
          formData.listing_fee_amount !== settings?.listing_fee_amount) {
        updateData.listing_fee_amount = formData.listing_fee_amount;
      }

      if (formData.commission_default_rate !== undefined && 
          formData.commission_default_rate !== settings?.commission_default_rate) {
        updateData.commission_default_rate = formData.commission_default_rate;
      }

      if (formData.commission_threshold !== undefined && 
          formData.commission_threshold !== settings?.commission_threshold) {
        updateData.commission_threshold = formData.commission_threshold;
      }

      // Kiểm tra xem có thay đổi nào không
      if (Object.keys(updateData).length === 0) {
        toast.info('Không có thay đổi nào để lưu.');
        setSaving(false);
        return;
      }

      const updated = await platformSettingsApi.updateSettings(updateData);
      setSettings(updated);
      
      // Cập nhật formData với giá trị mới từ server
      setFormData({
        listing_fee_amount: updated.listing_fee_amount,
        commission_default_rate: updated.commission_default_rate,
        commission_threshold: updated.commission_threshold,
      });

      toast.success('Cập nhật cấu hình thành công!');
    } catch (err: unknown) {
      console.error('Error updating platform settings:', err);
      const error = err as { response?: { data?: { message?: string | string[] }; status?: number }; message?: string };
      
      // Handle specific error codes
      if (error.response?.status === 400) {
        // Validation error
        const validationErrors = error.response?.data?.message;
        const errorText = Array.isArray(validationErrors) 
          ? validationErrors.join(', ') 
          : (typeof validationErrors === 'string' ? validationErrors : 'Dữ liệu không hợp lệ');
        setError(errorText);
        toast.error(errorText);
      } else if (error.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (error.response?.status === 403) {
        setError('Bạn không có quyền thực hiện thao tác này.');
        toast.error('Bạn không có quyền thực hiện thao tác này.');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Không thể cập nhật cấu hình';
        const errorText = Array.isArray(errorMessage) 
          ? errorMessage.join(', ') 
          : (typeof errorMessage === 'string' ? errorMessage : 'Không thể cập nhật cấu hình');
        setError(errorText);
        toast.error(errorText);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      setFormData({
        listing_fee_amount: settings.listing_fee_amount,
        commission_default_rate: settings.commission_default_rate,
        commission_threshold: settings.commission_threshold,
      });
      setError(null);
      toast.info('Đã khôi phục giá trị ban đầu.');
    }
  };

  if (loading) {
    return (
      <div className="admin-platform-settings">
        <div className="loading-state">
          <RefreshCw className="spinning" size={48} />
          <p>Đang tải cấu hình...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-platform-settings">
      <div className="admin-platform-settings__header">
        <h1 className="admin-platform-settings__title">
          <Settings size={32} />
          Cấu hình phí và hoa hồng
        </h1>
        <button
          className="admin-platform-settings__refresh-btn"
          onClick={loadSettings}
          title="Làm mới"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
        </div>
      )}

      <div className="settings-card">
        <form onSubmit={handleSubmit} className="settings-form">
          {/* Listing Fee Amount */}
          <div className="form-group">
            <label className="form-label">
              <DollarSign size={20} />
              Phí đăng tin (VND)
            </label>
            <input
              type="number"
              className="form-input"
              value={formData.listing_fee_amount ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  listing_fee_amount: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              min="0"
              step="1000"
              placeholder="Nhập phí đăng tin"
            />
            <small className="form-helper">
              Giá trị hiện tại: {settings?.listing_fee_amount?.toLocaleString('vi-VN')} VND
              <br />
              Phí này được áp dụng khi người dùng tạo listing hoặc auction mới.
            </small>
          </div>

          {/* Commission Default Rate */}
          <div className="form-group">
            <label className="form-label">
              <Percent size={20} />
              Tỷ lệ hoa hồng mặc định (%)
            </label>
            <input
              type="number"
              className="form-input"
              value={formData.commission_default_rate !== undefined ? (formData.commission_default_rate * 100) : ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  commission_default_rate: e.target.value ? Number(e.target.value) / 100 : undefined,
                })
              }
              min="0"
              max="100"
              step="0.1"
              placeholder="Nhập tỷ lệ hoa hồng (%)"
            />
            <small className="form-helper">
              Giá trị hiện tại: {settings?.commission_default_rate ? (settings.commission_default_rate * 100).toFixed(2) : '0'}%
              <br />
              Tỷ lệ này áp dụng cho giao dịch có giá trị &gt;= ngưỡng hoa hồng.
              <br />
              <strong>Lưu ý:</strong> Nhập phần trăm (ví dụ: 2.5 cho 2.5%)
            </small>
          </div>

          {/* Commission Threshold */}
          <div className="form-group">
            <label className="form-label">
              <TrendingUp size={20} />
              Ngưỡng giá trị hoa hồng (VND)
            </label>
            <input
              type="number"
              className="form-input"
              value={formData.commission_threshold ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  commission_threshold: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              min="0"
              step="1000000"
              placeholder="Nhập ngưỡng giá trị"
            />
            <small className="form-helper">
              Giá trị hiện tại: {settings?.commission_threshold?.toLocaleString('vi-VN')} VND
              <br />
              Giao dịch dưới ngưỡng này sẽ dùng tỷ lệ hoa hồng mặc định 2%.
              <br />
              Giao dịch &gt;= ngưỡng này sẽ dùng tỷ lệ hoa hồng mặc định đã cấu hình.
            </small>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={saving}
            >
              <RefreshCw size={18} />
              Khôi phục
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <RefreshCw size={18} className="spinning" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminReviewManagementPage;
