// src/pages/AdminUserManagementPage/AdminUserManagementPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  Users, Search, Filter, Edit, CheckCircle, Ban, Trash2, Eye, 
  RefreshCw, Mail, Shield, UserCheck, UserX, Clock
} from 'lucide-react';
import authApi from "../../api/authApi";
import type { User } from "../../types";
import { AdminUpdateUserDto } from "../../types/api";
import { toast } from 'react-toastify';
import "./AdminUserManagementPage.scss";
import Pagination from "../../components/common/Pagination/Pagination";
import UserDetailModal from "../../components/modals/UserDetailModal/UserDetailModal";

interface UserStats {
  total: number;
  byRole: Record<string, number>;
  byStatus: Record<string, number>;
}

const AdminUserManagementPage: React.FC = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'banned'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });
  const ITEMS_PER_PAGE = 10;

  // Debounced search
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch users and stats
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      let usersData: User[] = [];

      if (debouncedSearchQuery.trim()) {
        // Use search API
        const searchResponse = await authApi.searchUsers(debouncedSearchQuery);
        usersData = Array.isArray(searchResponse.data) ? searchResponse.data : [];
      } else {
        // Get all users
        const response = await authApi.getUsers();
        usersData = Array.isArray(response.data) ? response.data : [];
      }

      setAllUsers(usersData);
      const totalPages = Math.ceil(usersData.length / ITEMS_PER_PAGE);
      setPagination(prev => ({ ...prev, totalPages }));
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Không thể tải danh sách người dùng");
      setAllUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery]);

  // Fetch user stats
  const fetchUserStats = useCallback(async () => {
    try {
      const response = await authApi.getUserStats();
      setUserStats(response.data);
    } catch (error: any) {
      console.error("Error fetching user stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  // Filter users by role and status
  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      const roleMatch = roleFilter === 'all' || user.role === roleFilter;
      const statusMatch = statusFilter === 'all' || user.status === statusFilter;
      return roleMatch && statusMatch;
    });
  }, [allUsers, roleFilter, statusFilter]);

  // Pagination
  useEffect(() => {
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    setPagination(prev => ({ 
      ...prev, 
      totalPages,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage
    }));
  }, [filteredUsers.length]);

  const startIndex = (pagination.currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const displayedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset pagination when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [roleFilter, statusFilter, debouncedSearchQuery]);

  // Handlers
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsEditMode(false);
    setIsDetailModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditMode(true);
    setIsDetailModalOpen(true);
  };

  const handleApprove = async (userId: string) => {
    try {
      const response = await authApi.approveUser(userId);
      if (response.data) {
        toast.success("Phê duyệt người dùng thành công");
        await fetchUsers();
        await fetchUserStats();
      }
    } catch (error: any) {
      console.error("Error approving user:", error);
      toast.error(error.response?.data?.message || "Không thể phê duyệt người dùng");
    }
  };

  const handleBan = async (userId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn khóa người dùng này?")) {
      return;
    }
    try {
      const response = await authApi.banUser(userId);
      if (response.data) {
        toast.success("Khóa người dùng thành công");
        await fetchUsers();
        await fetchUserStats();
      }
    } catch (error: any) {
      console.error("Error banning user:", error);
      toast.error(error.response?.data?.message || "Không thể khóa người dùng");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.")) {
      return;
    }
    try {
      await authApi.deleteUser(userId);
      toast.success("Xóa người dùng thành công");
      await fetchUsers();
      await fetchUserStats();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.response?.data?.message || "Không thể xóa người dùng");
    }
  };

  const handleUpdate = async (userId: string, data: AdminUpdateUserDto) => {
    try {
      const response = await authApi.updateUser(userId, data);
      if (response.data) {
        toast.success("Cập nhật thông tin người dùng thành công");
        setIsDetailModalOpen(false);
        await fetchUsers();
        await fetchUserStats();
      }
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.response?.data?.message || "Không thể cập nhật thông tin người dùng");
      throw error;
    }
  };

  const handleRefresh = () => {
    fetchUsers();
    fetchUserStats();
    toast.info("Đang làm mới dữ liệu...");
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-badge--active';
      case 'banned':
        return 'status-badge--banned';
      case 'inactive':
        return 'status-badge--inactive';
      case 'suspended':
        return 'status-badge--suspended';
      default:
        return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Hoạt động';
      case 'banned':
        return 'Bị cấm';
      case 'inactive':
        return 'Không hoạt động';
      case 'suspended':
        return 'Tạm khóa';
      default:
        return status;
    }
  };

  return (
    <div className="admin-user-management">
      {/* Header */}
      <div className="admin-user-management__header">
        <h1 className="admin-user-management__title">
          <Users size={32} />
          Quản lý người dùng
        </h1>
        <button 
          className="admin-user-management__refresh-btn"
          onClick={handleRefresh}
          title="Làm mới"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Stats Cards */}
      {userStats && (
        <div className="stats-cards">
          <div className="stat-card stat-card--total">
            <div className="stat-card__icon">
              <Users size={24} />
            </div>
            <div className="stat-card__content">
              <h3 className="stat-card__label">Tổng người dùng</h3>
              <p className="stat-card__value">{userStats.total.toLocaleString('vi-VN')}</p>
            </div>
          </div>

          <div className="stat-card stat-card--admin">
            <div className="stat-card__icon">
              <Shield size={24} />
            </div>
            <div className="stat-card__content">
              <h3 className="stat-card__label">Quản trị viên</h3>
              <p className="stat-card__value">{(userStats.byRole.admin || 0).toLocaleString('vi-VN')}</p>
            </div>
          </div>

          <div className="stat-card stat-card--user">
            <div className="stat-card__icon">
              <UserCheck size={24} />
            </div>
            <div className="stat-card__content">
              <h3 className="stat-card__label">Người dùng</h3>
              <p className="stat-card__value">{(userStats.byRole.user || 0).toLocaleString('vi-VN')}</p>
            </div>
          </div>

          <div className="stat-card stat-card--active">
            <div className="stat-card__icon">
              <CheckCircle size={24} />
            </div>
            <div className="stat-card__content">
              <h3 className="stat-card__label">Đang hoạt động</h3>
              <p className="stat-card__value">{(userStats.byStatus.active || 0).toLocaleString('vi-VN')}</p>
            </div>
          </div>

          <div className="stat-card stat-card--banned">
            <div className="stat-card__icon">
              <Ban size={24} />
            </div>
            <div className="stat-card__content">
              <h3 className="stat-card__label">Bị cấm</h3>
              <p className="stat-card__value">{(userStats.byStatus.banned || 0).toLocaleString('vi-VN')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="admin-user-management__filters">
        <div className="search-box">
          <Search size={20} className="search-box__icon" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-box__input"
          />
        </div>

        <div className="filters">
          <div className="filter-group">
            <Filter size={18} />
            <label>Vai trò:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'user')}
              className="filter-select"
            >
              <option value="all">Tất cả</option>
              <option value="admin">Quản trị viên</option>
              <option value="user">Người dùng</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Trạng thái:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'banned')}
              className="filter-select"
            >
              <option value="all">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="banned">Bị cấm</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-user-management__table-container">
        {isLoading ? (
          <div className="loading-state">
            <RefreshCw size={32} className="spinning" />
            <p>Đang tải danh sách người dùng...</p>
          </div>
        ) : displayedUsers.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <p>Không tìm thấy người dùng nào</p>
          </div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Xác thực</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {displayedUsers.map((user: User) => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-cell">
                        <img
                          src={user.avatar_url || user.avatar || "https://i.pravatar.cc/150"}
                          alt={user.full_name || user.name || 'User'}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://i.pravatar.cc/150";
                          }}
                        />
                        <div className="user-cell__info">
                          <span className="user-cell__name">
                            {user.full_name || user.name || 'N/A'}
                          </span>
                          {user.phone && (
                            <span className="user-cell__phone">{user.phone}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="email-cell">
                        <Mail size={16} />
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge role-badge--${user.role}`}>
                        {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(user.status || 'active')}`}>
                        {getStatusLabel(user.status || 'active')}
                      </span>
                    </td>
                    <td>
                      {user.isEmailVerified ? (
                        <span className="verified-badge">
                          <CheckCircle size={16} />
                          Đã xác thực
                        </span>
                      ) : (
                        <span className="unverified-badge">
                          <Clock size={16} />
                          Chưa xác thực
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn action-btn--view"
                          onClick={() => handleViewUser(user)}
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="action-btn action-btn--edit"
                          onClick={() => handleEditUser(user)}
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </button>
                        {!user.isEmailVerified && (
                          <button
                            className="action-btn action-btn--approve"
                            onClick={() => handleApprove(user._id)}
                            title="Phê duyệt"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {user.status !== 'banned' && (
                          <button
                            className="action-btn action-btn--ban"
                            onClick={() => handleBan(user._id)}
                            title="Khóa tài khoản"
                          >
                            <Ban size={16} />
                          </button>
                        )}
                        <button
                          className="action-btn action-btn--delete"
                          onClick={() => handleDelete(user._id)}
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination.totalPages > 1 && (
              <div className="admin-user-management__pagination">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={(page) =>
                    setPagination((prev) => ({ ...prev, currentPage: page }))
                  }
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          isOpen={isDetailModalOpen}
          isEditMode={isEditMode}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedUser(null);
            setIsEditMode(false);
          }}
          onUpdate={handleUpdate}
          onRefresh={() => {
            fetchUsers();
            fetchUserStats();
          }}
        />
      )}
    </div>
  );
};

export default AdminUserManagementPage;
