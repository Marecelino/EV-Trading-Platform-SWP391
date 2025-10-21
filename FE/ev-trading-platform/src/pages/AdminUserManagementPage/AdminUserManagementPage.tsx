// src/pages/AdminUserManagementPage/AdminUserManagementPage.tsx
import React, { useEffect, useState, useCallback } from "react";
import adminApi from "../../api/adminApi";
import type { User } from "../../types";
import "./AdminUserManagementPage.scss";
import Pagination from "../../components/common/Pagination/Pagination";

const AdminUserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });
  const ITEMS_PER_PAGE = 5;

  const fetchUsers = useCallback((page: number) => {
    setIsLoading(true);
    adminApi
      .getUsers(page, ITEMS_PER_PAGE)
      .then((response) => {
        if (response.data.success) {
          setUsers(response.data.data);
          setPagination({
            currentPage: response.data.pagination.page,
            totalPages: response.data.pagination.pages,
          });
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchUsers(pagination.currentPage);
  }, [pagination.currentPage, fetchUsers]);

  const handleStatusToggle = (
    userId: string,
    currentStatus: User["status"]
  ) => {
    if (currentStatus !== "active" && currentStatus !== "suspended") {
      console.warn(
        `Cannot toggle status for user ${userId} from state ${currentStatus}`
      );
      return;
    }

    const newStatus: "active" | "suspended" =
      currentStatus === "active" ? "suspended" : "active";

    adminApi.updateUserStatus(userId, newStatus).then((response) => {
      if (response.data.success) {
        setUsers((currentUsers) =>
          currentUsers.map((user) =>
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
            {users.map((user) => (
              <tr key={user._id}>
                <td>
                  <div className="user-cell">
                    <img
                      src={user.avatar_url || "https://i.pravatar.cc/150"}
                      alt={user.full_name}
                    />
                    <span>{user.full_name}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`status-badge status--${user.status}`}>
                    {user.status === "active" ? "Hoạt động" : "Đã khóa"}
                  </span>
                </td>
                <td>
                  <button
                    className={`action-btn ${
                      user.status === "active" ? "btn--lock" : "btn--unlock"
                    }`}
                    onClick={() => handleStatusToggle(user._id, user.status)}
                  >
                    {user.status === "active" ? "Khóa" : "Mở khóa"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={(page) =>
          setPagination((prev) => ({ ...prev, currentPage: page }))
        }
      />
    </div>
  );
};

export default AdminUserManagementPage;
