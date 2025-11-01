// src/components/modals/EditProfileModal/EditProfileModal.tsx
import React, { useState, useEffect } from 'react';
import type { User } from '../../../types';
import { UpdateUserDto, ChangePasswordDto } from '../../../types/api';
import Button from '../../common/Button/Button';
import { X } from 'lucide-react';
import './EditProfileModal.scss';

interface EditProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  // CRITICAL FIX: Use proper types from api.ts instead of 'any'
  onSave: (updatedData: UpdateUserDto | ChangePasswordDto) => Promise<void>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, isOpen, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    avatar_url: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        avatar_url: user.avatar_url || ''
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (activeTab === 'info') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setPasswordData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // CRITICAL FIX: Map form data to correct DTO structures
    let dataToSave: UpdateUserDto | ChangePasswordDto;
    
    if (activeTab === 'info') {
      // Map to UpdateUserDto: full_name -> name, avatar_url -> avatar
      dataToSave = {
        name: formData.full_name, // UpdateUserDto uses 'name' not 'full_name'
        phone: formData.phone,
        avatar: formData.avatar_url, // UpdateUserDto uses 'avatar' not 'avatar_url'
      } as UpdateUserDto;
    } else {
      // Map to ChangePasswordDto
      if (passwordData.newPassword !== passwordData.confirmNewPassword) {
        setError('Mật khẩu mới không khớp.');
        setIsLoading(false);
        return;
      }
      dataToSave = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword, // minLength: 8 per DTO
      } as ChangePasswordDto;
    }

    await onSave(dataToSave);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Chỉnh sửa hồ sơ</h3>
          <button onClick={onClose} className="close-btn"><X /></button>
        </div>
        
        <div className="modal-tabs">
            <button className={activeTab === 'info' ? 'active' : ''} onClick={() => setActiveTab('info')}>Thông tin cá nhân</button>
            <button className={activeTab === 'password' ? 'active' : ''} onClick={() => setActiveTab('password')}>Đổi mật khẩu</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <p className="error-message">{error}</p>}
          
          {/* TAB THÔNG TIN CÁ NHÂN */}
          {activeTab === 'info' && (
            <>
              <div className="form-group">
                <label>Ảnh đại diện (URL)</label>
                <input name="avatar_url" type="text" value={formData.avatar_url} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Họ và tên</label>
                <input name="full_name" type="text" value={formData.full_name} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} />
              </div>
            </>
          )}

          {/* TAB ĐỔI MẬT KHẨU */}
          {activeTab === 'password' && (
            <>
              <div className="form-group">
                <label>Mật khẩu hiện tại</label>
                <input name="currentPassword" type="password" value={passwordData.currentPassword} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Mật khẩu mới</label>
                <input name="newPassword" type="password" value={passwordData.newPassword} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Xác nhận mật khẩu mới</label>
                <input name="confirmNewPassword" type="password" value={passwordData.confirmNewPassword} onChange={handleInputChange} required />
              </div>
            </>
          )}

          <div className="modal-footer">
             <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
             <Button type="submit" variant="primary" disabled={isLoading}>
                {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default EditProfileModal;