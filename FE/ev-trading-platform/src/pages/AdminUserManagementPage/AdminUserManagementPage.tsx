// src/pages/AdminUserManagementPage/AdminUserManagementPage.tsx
import React, { useEffect, useState, useCallback } from "react";
import authApi from "../../api/authApi";
import type { User } from "../../types";
import "./AdminUserManagementPage.scss";
import Pagination from "../../components/common/Pagination/Pagination";

const AdminUserManagementPage: React.FC = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });
  const ITEMS_PER_PAGE = 5;

  // Tính toán users hiển thị dựa trên pagination và search
  const filteredUsers = allUsers.filter(user => 
    !searchQuery || 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (pagination.currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const displayedUsers = filteredUsers.slice(startIndex, endIndex);

  const fetchUsers = useCallback(() => {
    setIsLoading(true);
    console.log("=== FETCHING ALL USERS ===");
    
    // Chỉ fetch tất cả users một lần
    authApi.getUsers()
      .then((response: any) => {
        console.log("=== USERS API RESPONSE ===");
        console.log("Full response:", response);
        console.log("Response data:", response.data);
        console.log("Response data structure:", {
          success: response.data?.success,
          data: response.data?.data,
          pagination: response.data?.pagination,
          meta: response.data?.meta
        });

        // Theo Swagger, /auth/users trả về array trực tiếp
        let usersData = null;
        let paginationData = null;

        // Cách 1: response.data là array trực tiếp (theo Swagger)
        if (Array.isArray(response.data)) {
          usersData = response.data;
          // Không có pagination từ API này, tự tính toán
          const totalPages = Math.ceil(response.data.length / ITEMS_PER_PAGE);
          paginationData = {
            page: page,
            pages: totalPages,
            total: response.data.length
          };
        }
        // Cách 2: response.data.data (cấu trúc wrapper)
        else if (response.data?.success && response.data?.data) {
          usersData = response.data.data;
          paginationData = response.data.pagination;
        }
        // Cách 3: response.data trực tiếp nhưng không phải array
        else if (response.data && typeof response.data === 'object') {
          usersData = response.data.data || [];
          paginationData = response.data.pagination || response.data.meta;
        }

        console.log("Extracted users data:", usersData);
        console.log("Extracted pagination data:", paginationData);

        if (usersData && Array.isArray(usersData)) {
          setAllUsers(usersData);
          console.log(`Loaded ${usersData.length} users`);
        } else {
          console.warn("No valid users data found in response");
          setAllUsers([]);
        }
      })
      .catch((error: any) => {
        console.error("Error fetching users:", error);
        console.error("Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setAllUsers([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset pagination when search changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [searchQuery]);

  // Update pagination when filtered users change
  useEffect(() => {
    setPagination(prev => ({ 
      ...prev, 
      totalPages: totalPages,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage
    }));
  }, [totalPages]);

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

    authApi.updateUserStatus(userId, newStatus).then((response: any) => {
      console.log("Status update response:", response);
      if (response.data?.success || response.status === 200) {
        setAllUsers((currentUsers) =>
          currentUsers.map((user) =>
            user._id === userId ? { ...user, status: newStatus } : user
          )
        );
      }
    }).catch((error: any) => {
      console.error("Error updating user status:", error);
    });
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    authApi.updateUserRole(userId, newRole).then((response) => {
      console.log("Role update response:", response);
      if (response.data?.success || response.status === 200) {
        setUsers((currentUsers) =>
          currentUsers.map((user) =>
            user._id === userId ? { ...user, role: newRole as User["role"] } : user
          )
        );
      }
    }).catch((error) => {
      console.error("Error updating user role:", error);
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      authApi.deleteUser(userId).then((response) => {
        console.log("Delete user response:", response);
        if (response.data?.success || response.status === 200) {
          setUsers((currentUsers) =>
            currentUsers.filter((user) => user._id !== userId)
          );
        }
      }).catch((error) => {
        console.error("Error deleting user:", error);
      });
    }
  };

  if (isLoading) return <div>Đang tải danh sách người dùng...</div>;

  return (
    <div className="admin-page">
      <h1>Quản lý người dùng</h1>
      
      {/* Search Box */}
      <div className="admin-search-box" style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Tìm kiếm người dùng theo tên hoặc email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            fontSize: '14px'
          }}
        />
      </div>

      {/* Debug Info */}
      <div className="debug-info" style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h4>Debug Info:</h4>
        <p>Đang hiển thị {users.length} người dùng</p>
        <p>Trang hiện tại: {pagination.currentPage} / {pagination.totalPages}</p>
        <p>Query tìm kiếm: "{searchQuery}"</p>
        <p><strong>Lưu ý:</strong> Kiểm tra Console để xem chi tiết API responses.</p>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Email</th>
              <th>Vai trò</th>
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
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    style={{
                      padding: '5px',
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      fontSize: '12px'
                    }}
                  >
                    <option value="member">Thành viên</option>
                    <option value="admin">Quản trị viên</option>
                    <option value="user">Người dùng</option>
                  </select>
                </td>
                <td>
                  <span className={`status-badge status--${user.status}`}>
                    {user.status === "active" ? "Hoạt động" : 
                     user.status === "suspended" ? "Đã khóa" : 
                     user.status === "banned" ? "Bị cấm" : user.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    <button
                      className={`action-btn ${
                        user.status === "active" ? "btn--lock" : "btn--unlock"
                      }`}
                      onClick={() => handleStatusToggle(user._id, user.status)}
                      style={{ fontSize: '11px', padding: '3px 6px' }}
                    >
                      {user.status === "active" ? "Khóa" : "Mở khóa"}
                    </button>
                    <button
                      className="action-btn btn--delete"
                      onClick={() => handleDeleteUser(user._id)}
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
