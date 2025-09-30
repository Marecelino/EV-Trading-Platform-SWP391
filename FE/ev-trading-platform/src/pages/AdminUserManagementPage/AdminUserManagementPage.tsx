// src/pages/AdminUserManagementPage/AdminUserManagementPage.tsx
import React, { useEffect, useState } from 'react';
import adminApi from '../../api/adminApi';
import type { User } from '../../types';
import './AdminUserManagementPage.scss';

const AdminUserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    adminApi.getUsers().then(response => {
      if (response.data.success) {
        setUsers(response.data.data);
      }
    }).finally(() => setIsLoading(false));
  }, []);

  const handleStatusToggle = (userId: string, currentStatus: 'active' | 'suspended') => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    
    adminApi.updateUserStatus(userId, newStatus).then(response => {
      if (response.data.success) {
        
        setUsers(currentUsers => 
          currentUsers.map(user => 
            user._id === userId ? { ...user, status: newStatus } : user
          )
        );
      }
    });
  };

  if (isLoading) return <div>Đang tải danh sách người dùng...</div>;

  return (
    <div className="admin-page">
      <h1>Quản lý người dùng</h1>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Email</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>
                  <div className="user-cell">
                    <img src={user.avatar_url || 'https://i.pravatar.cc/150'} alt={user.full_name} />
                    <span>{user.full_name}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`status-badge status--${user.status}`}>
                    {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                  </span>
                </td>
                <td>
                  <button 
                    className={`action-btn ${user.status === 'active' ? 'btn--lock' : 'btn--unlock'}`}
                    onClick={() => handleStatusToggle(user._id, user.status)}
                  >
                    {user.status === 'active' ? 'Khóa' : 'Mở khóa'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUserManagementPage;