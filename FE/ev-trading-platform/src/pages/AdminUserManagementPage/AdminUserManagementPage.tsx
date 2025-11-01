// src/pages/AdminUserManagementPage/AdminUserManagementPage.tsx
import React, { useEffect, useState, useCallback } from "react";
import authApi from "../../api/authApi";
import type { User } from "../../types";
import { UpdateUserDto } from "../../types/api";
import "./AdminUserManagementPage.scss";
import Pagination from "../../components/common/Pagination/Pagination";

// Interface cho API response
interface UsersApiResponse {
  data: User[] | {
    success: boolean;
    data: User[];
    pagination?: {
      page: number;
      pages: number;
      total: number;
    };
    meta?: {
      page: number;
      pages: number;
      total: number;
    };
  };
}

interface ApiError {
  message: string;
  response?: {
    data?: unknown;
    status?: number;
  };
}

interface ApiResponse {
  data?: {
    success?: boolean;
  };
  status?: number;
}

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
      .then((response: UsersApiResponse) => {
        console.log("=== USERS API RESPONSE ===");
        console.log("Full response:", response);
        console.log("Response data:", response.data);
        console.log("Response data structure:", {
          success: typeof response.data === 'object' && !Array.isArray(response.data) ? response.data.success : undefined,
          data: typeof response.data === 'object' && !Array.isArray(response.data) ? response.data.data : undefined,
          pagination: typeof response.data === 'object' && !Array.isArray(response.data) ? response.data.pagination : undefined,
          meta: typeof response.data === 'object' && !Array.isArray(response.data) ? response.data.meta : undefined
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
            page: 1,
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
      .catch((error: ApiError) => {
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

    // CRITICAL FIX: Use UpdateUserDto type, but allow status for admin operations
    // Note: Backend may accept status as an admin-only field
    // authApi.updateUser returns AxiosResponse<User>, so response.data is User
    authApi.updateUser(userId, { status: newStatus } as UpdateUserDto & { status?: string; role?: string }).then((response) => {
      console.log("Status update response:", response);
      // Response is AxiosResponse<User>, so response.data is User or wrapped in success object
      const responseData = response.data as User | { data?: User; success?: boolean };
      const userData = 'data' in responseData && responseData.data ? responseData.data : (responseData as User);
      if (response.status === 200 || (userData && typeof userData === 'object' && '_id' in userData)) {
        setAllUsers((currentUsers: User[]) =>
          currentUsers.map((user: User) =>
            user._id === userId ? { ...user, status: newStatus } : user
          )
        );
      }
    }).catch((error: ApiError) => {
      console.error("Error updating user status:", error);
    });
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    // CRITICAL FIX: Use UpdateUserDto type, but allow role for admin operations
    // authApi.updateUser returns AxiosResponse<User>, so response.data is User
    authApi.updateUser(userId, { role: newRole } as UpdateUserDto & { status?: string; role?: string }).then((response) => {
      console.log("Role update response:", response);
      // Response is AxiosResponse<User>, so response.data is User or wrapped in success object
      const responseData = response.data as User | { data?: User; success?: boolean };
      const userData = 'data' in responseData && responseData.data ? responseData.data : (responseData as User);
      if (response.status === 200 || (userData && typeof userData === 'object' && '_id' in userData)) {
        setAllUsers((currentUsers: User[]) =>
          currentUsers.map((user: User) =>
            user._id === userId ? { ...user, role: newRole as User["role"] } : user
          )
        );
      }
    }).catch((error: ApiError) => {
      console.error("Error updating user role:", error);
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      authApi.deleteUser(userId).then((response: ApiResponse) => {
        console.log("Delete user response:", response);
        if (response.data?.success || response.status === 200) {
          setAllUsers((currentUsers: User[]) =>
            currentUsers.filter((user: User) => user._id !== userId)
          );
        }
      }).catch((error: ApiError) => {
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
        <p>Đang hiển thị {displayedUsers.length} người dùng (tổng {allUsers.length})</p>
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
            {displayedUsers.map((user: User) => (
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
