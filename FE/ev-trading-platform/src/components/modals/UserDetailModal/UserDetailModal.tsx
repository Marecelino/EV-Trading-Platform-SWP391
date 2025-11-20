// src/components/modals/UserDetailModal/UserDetailModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { X, Edit, Save, XCircle, FileText, CreditCard, User as UserIcon, Mail, Phone, MapPin, Shield, CheckCircle, Ban, Trash2 } from 'lucide-react';
import type { User } from '../../../types';
import { AdminUpdateUserDto } from '../../../types/api';
import authApi from '../../../api/authApi';
import { Product } from '../../../types';
import { ITransaction } from '../../../types';
import { PaginatedResponse } from '../../../types/api';
import { toast } from 'react-toastify';
import './UserDetailModal.scss';

interface UserDetailModalProps {
  user: User;
  isOpen: boolean;
  isEditMode: boolean;
  onClose: () => void;
  onUpdate: (userId: string, data: AdminUpdateUserDto) => Promise<void>;
  onRefresh?: () => void; // Callback để refresh danh sách users sau khi thực hiện action
}

type TabType = 'info' | 'listings' | 'transactions';

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  isEditMode,
  onClose,
  onUpdate,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [isEditing, setIsEditing] = useState(isEditMode);
  const [formData, setFormData] = useState<AdminUpdateUserDto>({
    name: user.full_name || user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    role: (user.role === 'member' ? 'user' : user.role) as 'user' | 'admin' || 'user',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listings, setListings] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'buyer' | 'seller'>('all');

  useEffect(() => {
    if (isOpen) {
      setIsEditing(isEditMode);
      setFormData({
        name: user.full_name || user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        role: (user.role === 'member' ? 'user' : user.role) as 'user' | 'admin' || 'user',
      });
      setActiveTab('info');
    }
  }, [isOpen, isEditMode, user]);

  const loadListings = useCallback(async () => {
    setIsLoadingListings(true);
    try {
      const response = await authApi.getUserListings(user._id, { page: 1, limit: 50 });
      const data = response.data;
      if (data && typeof data === 'object') {
        const listingsResponse = data as PaginatedResponse<Product>;
        setListings(Array.isArray(listingsResponse.data) ? listingsResponse.data : []);
      } else if (Array.isArray(data)) {
        setListings(data);
      } else {
        setListings([]);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
      setListings([]);
    } finally {
      setIsLoadingListings(false);
    }
  }, [user._id]);

  const loadTransactions = useCallback(async () => {
    setIsLoadingTransactions(true);
    try {
      const params = transactionFilter !== 'all' ? { as: transactionFilter } : undefined;
      const response = await authApi.getUserTransactions(user._id, params);
      const data = response.data;
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [user._id, transactionFilter]);

  useEffect(() => {
    if (isOpen && activeTab === 'listings') {
      loadListings();
    }
  }, [isOpen, activeTab, loadListings]);

  useEffect(() => {
    if (isOpen && activeTab === 'transactions') {
      loadTransactions();
    }
  }, [isOpen, activeTab, loadTransactions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onUpdate(user._id, formData);
      setIsEditing(false);
    } catch {
      // Error is handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user.full_name || user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      role: (user.role === 'member' ? 'user' : user.role) as 'user' | 'admin' || 'user',
    });
  };

  const handleApprove = async () => {
    try {
      const response = await authApi.approveUser(user._id);
      if (response.data) {
        toast.success("Phê duyệt người dùng thành công");
        onRefresh?.();
        onClose();
      }
    } catch (error: unknown) {
      console.error("Error approving user:", error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errorMessage || "Không thể phê duyệt người dùng");
    }
  };

  const handleBan = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn khóa người dùng này?")) {
      return;
    }
    try {
      const response = await authApi.banUser(user._id);
      if (response.data) {
        toast.success("Khóa người dùng thành công");
        onRefresh?.();
        onClose();
      }
    } catch (error: unknown) {
      console.error("Error banning user:", error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errorMessage || "Không thể khóa người dùng");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.")) {
      return;
    }
    try {
      await authApi.deleteUser(user._id);
      toast.success("Xóa người dùng thành công");
      onRefresh?.();
      onClose();
    } catch (error: unknown) {
      console.error("Error deleting user:", error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errorMessage || "Không thể xóa người dùng");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="user-detail-modal-overlay" onClick={onClose}>
      <div className="user-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="user-detail-modal__header">
          <div className="user-detail-modal__header-content">
            <div className="user-detail-modal__avatar">
              <img
                src={user.avatar_url || user.avatar || "https://i.pravatar.cc/150"}
                alt={user.full_name || user.name || 'User'}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://i.pravatar.cc/150";
                }}
              />
            </div>
            <div className="user-detail-modal__title">
              <h2>{user.full_name || user.name || 'N/A'}</h2>
              <p>{user.email}</p>
            </div>
          </div>
          <button className="user-detail-modal__close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="user-detail-modal__tabs">
          <button
            className={`user-detail-modal__tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <UserIcon size={18} />
            Thông tin
          </button>
          <button
            className={`user-detail-modal__tab ${activeTab === 'listings' ? 'active' : ''}`}
            onClick={() => setActiveTab('listings')}
          >
            <FileText size={18} />
            Tin đăng ({listings.length})
          </button>
          <button
            className={`user-detail-modal__tab ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <CreditCard size={18} />
            Giao dịch ({transactions.length})
          </button>
        </div>

        <div className="user-detail-modal__content">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="user-detail-modal__info">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="user-detail-form">
                  <div className="form-group">
                    <label>
                      <UserIcon size={16} />
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Mail size={16} />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Phone size={16} />
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <MapPin size={16} />
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Shield size={16} />
                      Vai trò
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                    >
                      <option value="user">Người dùng</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn--primary"
                      disabled={isSubmitting}
                    >
                      <Save size={16} />
                      {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      <XCircle size={16} />
                      Hủy
                    </button>
                  </div>
                </form>
              ) : (
                <div className="user-detail-info">
                  <div className="info-item">
                    <label>
                      <UserIcon size={16} />
                      Họ và tên
                    </label>
                    <p>{user.full_name || user.name || 'N/A'}</p>
                  </div>

                  <div className="info-item">
                    <label>
                      <Mail size={16} />
                      Email
                    </label>
                    <p>{user.email}</p>
                  </div>

                  <div className="info-item">
                    <label>
                      <Phone size={16} />
                      Số điện thoại
                    </label>
                    <p>{user.phone || 'N/A'}</p>
                  </div>

                  <div className="info-item">
                    <label>
                      <MapPin size={16} />
                      Địa chỉ
                    </label>
                    <p>{user.address || 'N/A'}</p>
                  </div>

                  <div className="info-item">
                    <label>
                      <Shield size={16} />
                      Vai trò
                    </label>
                    <p>
                      <span className={`role-badge role-badge--${user.role}`}>
                        {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                      </span>
                    </p>
                  </div>

                  <div className="info-item">
                    <label>Trạng thái</label>
                    <p>
                      <span className={`status-badge status-badge--${user.status || 'active'}`}>
                        {user.status === 'active' ? 'Hoạt động' : 
                         user.status === 'banned' ? 'Bị cấm' : 
                         user.status === 'inactive' ? 'Không hoạt động' : 
                         user.status === 'suspended' ? 'Tạm khóa' : user.status}
                      </span>
                    </p>
                  </div>

                  <div className="info-item">
                    <label>Email đã xác thực</label>
                    <p>{user.isEmailVerified ? '✅ Có' : '❌ Chưa'}</p>
                  </div>

                  <div className="info-item">
                    <label>Hồ sơ đã hoàn tất</label>
                    <p>{user.profileCompleted ? '✅ Có' : '❌ Chưa'}</p>
                  </div>

                  <div className="info-actions">
                    <button
                      className="btn btn--primary"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit size={16} />
                      Chỉnh sửa
                    </button>
                    {!user.isEmailVerified && (
                      <button
                        className="btn btn--success"
                        onClick={handleApprove}
                        title="Phê duyệt người dùng"
                      >
                        <CheckCircle size={16} />
                        Phê duyệt
                      </button>
                    )}
                    {user.status !== 'banned' && (
                      <button
                        className="btn btn--warning"
                        onClick={handleBan}
                        title="Khóa tài khoản người dùng"
                      >
                        <Ban size={16} />
                        Khóa tài khoản
                      </button>
                    )}
                    <button
                      className="btn btn--danger"
                      onClick={handleDelete}
                      title="Xóa người dùng"
                    >
                      <Trash2 size={16} />
                      Xóa
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Listings Tab */}
          {activeTab === 'listings' && (
            <div className="user-detail-modal__listings">
              {isLoadingListings ? (
                <div className="loading-state">
                  <p>Đang tải danh sách tin đăng...</p>
                </div>
              ) : listings.length === 0 ? (
                <div className="empty-state">
                  <FileText size={48} />
                  <p>Người dùng này chưa có tin đăng nào</p>
                </div>
              ) : (
                <div className="listings-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Tiêu đề</th>
                        <th>Giá</th>
                        <th>Trạng thái</th>
                        <th>Ngày tạo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listings.map((listing) => (
                        <tr key={listing._id}>
                          <td>{listing.title}</td>
                          <td>{listing.price?.toLocaleString('vi-VN')} ₫</td>
                          <td>
                            <span className={`status-badge status-badge--${listing.status || 'draft'}`}>
                              {listing.status || 'draft'}
                            </span>
                          </td>
                          <td>
                            {listing.createdAt 
                              ? new Date(listing.createdAt).toLocaleDateString('vi-VN')
                              : listing.created_at
                              ? new Date(listing.created_at).toLocaleDateString('vi-VN')
                              : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="user-detail-modal__transactions">
              <div className="transaction-filter">
                <label>Lọc theo vai trò:</label>
                <select
                  value={transactionFilter}
                  onChange={(e) => setTransactionFilter(e.target.value as 'all' | 'buyer' | 'seller')}
                >
                  <option value="all">Tất cả</option>
                  <option value="buyer">Người mua</option>
                  <option value="seller">Người bán</option>
                </select>
              </div>

              {isLoadingTransactions ? (
                <div className="loading-state">
                  <p>Đang tải danh sách giao dịch...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="empty-state">
                  <CreditCard size={48} />
                  <p>Người dùng này chưa có giao dịch nào</p>
                </div>
              ) : (
                <div className="transactions-table">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Số tiền</th>
                        <th>Trạng thái</th>
                        <th>Ngày tạo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx._id}>
                          <td>{tx._id.substring(0, 8)}...</td>
                          <td>{tx.amount?.toLocaleString('vi-VN')} ₫</td>
                          <td>
                            <span className={`status-badge status-badge--${tx.status?.toLowerCase() || 'pending'}`}>
                              {tx.status || 'PENDING'}
                            </span>
                          </td>
                          <td>
                            {tx.createdAt 
                              ? new Date(tx.createdAt).toLocaleDateString('vi-VN')
                              : tx.created_at
                              ? new Date(tx.created_at).toLocaleDateString('vi-VN')
                              : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;

