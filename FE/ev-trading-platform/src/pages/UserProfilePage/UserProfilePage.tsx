// src/pages/UserProfilePage/UserProfilePage.tsx
import React, { useEffect, useState } from 'react';
import userApi from '../../api/userApi';
import type { User, ITransaction } from '../../types';
import { Edit } from 'lucide-react';
import './UserProfilePage.scss';
import EditProfileModal from '../../components/modals/EditProfileModal/EditProfileModal'; // <-- IMPORT MODAL

const UserProfilePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const profileRes = await userApi.getProfile();
        const transRes = await userApi.getMyTransactions();
        if (profileRes.data.success) setUser(profileRes.data.data);
        if (transRes.data.success) setTransactions(transRes.data.data);
      } catch (error) {
        console.error("Failed to fetch user data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
const handleUpdateProfile = async (updatedData: Partial<User>) => {
    try {
        const response = await userApi.updateProfile(updatedData);
        if (response.data.success) {
            setUser(response.data.data); // Cập nhật lại state user trên trang
            setIsEditModalOpen(false); // Đóng modal
            alert('Cập nhật thành công!');
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật profile:", error);
        alert('Cập nhật thất bại, vui lòng thử lại.');
    }
  };

  if (isLoading || !user) return <div>Đang tải thông tin...</div>;

  return (
    <>
     <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        onSave={handleUpdateProfile}
      />
    <div className="user-profile-page">
      <div className="profile-header content-card">
        <div className="avatar-section">
          <img src={user.avatar_url} alt={user.full_name} />
          <button className="edit-avatar-btn"><Edit size={16} /></button>
        </div>
        <div className="info-section">
          <h1>{user.full_name}</h1>
          <p>{user.email}</p>
           {user.phone && <p>SĐT: {user.phone}</p>} 
            <button className="edit-profile-btn" onClick={() => setIsEditModalOpen(true)}> 
                Chỉnh sửa thông tin
            </button>
        </div>
      </div>

      <div className="transaction-history content-card">
        <h2>Lịch sử giao dịch</h2>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Vai trò</th>
                <th>Số tiền</th>
                <th>Ngày</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx._id}>
                  <td>{tx.listing_id.title}</td>
                  <td>{tx.buyer_id._id === user._id ? 'Người mua' : 'Người bán'}</td>
                  <td>{tx.amount.toLocaleString('vi-VN')} ₫</td>
                  <td>{new Date(tx.created_at).toLocaleDateString('vi-VN')}</td>
                  <td><span className={`status-badge status--${tx.status}`}>{tx.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  );
};
export default UserProfilePage;