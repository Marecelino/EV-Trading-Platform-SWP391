import axiosClient from './axiosClient';
import {
  RegisterDto,
  LoginDto,
  LoginApiResponse,
  RegisterResponse,
  UpdateUserDto,
  AdminUpdateUserDto,
  ChangePasswordDto,
  CompleteRegistrationDto,
} from '../types/api';
import { User } from '../types';

/**
 * Helper function to extract User data from various API response structures
 * Handles:
 * - Mongoose document structure: { _doc: { ...userData } }
 * - Wrapped response: { data: { ...userData } }
 * - Direct user object: { _id: ..., ... }
 */
export const extractUserFromResponse = (responseData: unknown): User | null => {
  if (!responseData || typeof responseData !== 'object') {
    return null;
  }

  const data = responseData as Record<string, unknown>;

  // Handle Mongoose document structure: { _doc: { ...userData } }
  if ('_doc' in data && data._doc && typeof data._doc === 'object') {
    const userDoc = data._doc as Record<string, unknown>;
    // Map 'name' to 'full_name' if needed (backend may return 'name')
    if (userDoc._id && typeof userDoc._id === 'string') {
      return {
        _id: userDoc._id,
        email: (userDoc.email as string) || '',
        full_name: (userDoc.full_name as string) || (userDoc.name as string) || '',
        role: (userDoc.role as User['role']) || 'user',
        avatar_url: userDoc.avatar_url as string | undefined,
        phone: userDoc.phone as string | undefined,
        address: userDoc.address as string | undefined,
        dateOfBirth: userDoc.dateOfBirth as string | undefined,
        profileCompleted: userDoc.profileCompleted as boolean | undefined,
        status: (userDoc.status as User['status']) || 'active',
        rating: userDoc.review_average !== undefined || userDoc.review_count !== undefined
          ? {
              average: (userDoc.review_average as number) || 0,
              count: (userDoc.review_count as number) || 0,
            }
          : undefined,
        oauthProviders: userDoc.oauthProviders as User['oauthProviders'],
      } as User;
    }
  }

  // Handle wrapped response: { data: { ...userData } }
  if ('data' in data && data.data && typeof data.data === 'object') {
    const nestedData = data.data as Record<string, unknown>;
    // Recursively check if nested data has _doc or is direct user object
    if ('_doc' in nestedData) {
      return extractUserFromResponse(nestedData);
    }
    if (nestedData._id && typeof nestedData._id === 'string') {
      return {
        _id: nestedData._id,
        email: (nestedData.email as string) || '',
        full_name: (nestedData.full_name as string) || (nestedData.name as string) || '',
        role: (nestedData.role as User['role']) || 'user',
        avatar_url: nestedData.avatar_url as string | undefined,
        phone: nestedData.phone as string | undefined,
        address: nestedData.address as string | undefined,
        dateOfBirth: nestedData.dateOfBirth as string | undefined,
        profileCompleted: nestedData.profileCompleted as boolean | undefined,
        status: (nestedData.status as User['status']) || 'active',
        rating: nestedData.review_average !== undefined || nestedData.review_count !== undefined
          ? {
              average: (nestedData.review_average as number) || 0,
              count: (nestedData.review_count as number) || 0,
            }
          : undefined,
        oauthProviders: nestedData.oauthProviders as User['oauthProviders'],
      } as User;
    }
  }

  // Handle direct user object: { _id: ..., ... }
  if ('_id' in data && typeof data._id === 'string') {
    return {
      _id: data._id,
      email: (data.email as string) || '',
      full_name: (data.full_name as string) || (data.name as string) || '',
      role: (data.role as User['role']) || 'user',
      avatar_url: data.avatar_url as string | undefined,
      phone: data.phone as string | undefined,
      address: data.address as string | undefined,
      dateOfBirth: data.dateOfBirth as string | undefined,
      profileCompleted: data.profileCompleted as boolean | undefined,
      status: (data.status as User['status']) || 'active',
      rating: data.review_average !== undefined || data.review_count !== undefined
        ? {
            average: (data.review_average as number) || 0,
            count: (data.review_count as number) || 0,
          }
        : undefined,
      oauthProviders: data.oauthProviders as User['oauthProviders'],
    } as User;
  }

  return null;
};

const authApi = {
  // === BASIC AUTH ===
  register: (data: RegisterDto) => {
    return axiosClient.post<RegisterResponse>('/auth/register', data);
  },

  login: async (data: LoginDto): Promise<{ data: LoginApiResponse }> => {
    // DEBUG: Log request details
    console.log("=== AUTH API - LOGIN REQUEST ===");
    console.log("Endpoint: /auth/login");
    console.log("Request data:", { email: data.email, password: data.password ? "***" : undefined });
    console.log("Base URL:", axiosClient.defaults.baseURL);
    
    try {
      // CRITICAL FIX: Backend returns wrapped response: {success, message, data: {access_token, user, ...}}
      const response = await axiosClient.post<LoginApiResponse>('/auth/login', data);
      console.log("=== AUTH API - LOGIN SUCCESS ===");
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      console.log("Response data:", response.data);
      return response;
    } catch (error) {
      console.error("=== AUTH API - LOGIN ERROR ===");
      console.error("Error in authApi.login:", error);
      throw error;
    }
  },

  completeRegistration: (data: CompleteRegistrationDto) => {
    return axiosClient.post('/auth/register/complete', data);
  },

  // === PROFILE MANAGEMENT ===
  getProfile: () => {
    return axiosClient.get<User>('/auth/profile');
  },

  updateProfile: (data: UpdateUserDto) => {
    return axiosClient.put<User>('/auth/profile', data);
  },

  changePassword: (data: ChangePasswordDto) => {
    return axiosClient.patch<{ success: boolean; message: string }>('/auth/change-password', data);
  },

  // === USER MANAGEMENT (Admin only) ===
  getUsers: () => {
    return axiosClient.get<User[]>('/auth/users');
  },

  getUserById: (id: string) => {
    return axiosClient.get<User>(`/auth/users/${id}`);
  },

  updateUser: (id: string, data: UpdateUserDto | AdminUpdateUserDto) => {
    return axiosClient.put<User>(`/auth/users/${id}`, data);
  },

  deleteUser: (id: string) => {
    return axiosClient.delete(`/auth/users/${id}`);
  },

  // === USER SEARCH & FILTERS ===
  searchUsers: (query: string) => {
    return axiosClient.get<User[]>('/auth/users/search', { params: { q: query } });
  },

  getUserStats: () => {
    return axiosClient.get<{
      total: number;
      byRole: Record<string, number>;
      byStatus: Record<string, number>;
    }>('/auth/users/stats');
  },

  getUsersByRole: (role: 'user' | 'admin') => {
    return axiosClient.get<User[]>(`/auth/users/by-role/${role}`);
  },

  // === USER ACTIONS (Admin only) ===
  approveUser: (id: string) => {
    return axiosClient.patch<User>(`/auth/users/${id}/approve`);
  },

  banUser: (id: string) => {
    return axiosClient.patch<User>(`/auth/users/${id}/ban`);
  },

  getUserListings: (id: string, params?: { page?: number; limit?: number; status?: string }) => {
    return axiosClient.get(`/auth/users/${id}/listings`, { params });
  },

  getUserTransactions: (id: string, params?: { as?: 'buyer' | 'seller' }) => {
    return axiosClient.get(`/auth/users/${id}/transactions`, { params });
  },

  // === SOCIAL AUTH ===
  // Note: OAuth endpoints redirect, so they should be used with window.location
  googleAuth: () => {
    // Returns redirect URL, should use window.location.href instead of axios
    const baseURL = (import.meta.env as { VITE_API_BASE_URL?: string }).VITE_API_BASE_URL || 'http://localhost:3000/api';
    return `${baseURL}/auth/google`;
  },

  facebookAuth: () => {
    // Returns redirect URL, should use window.location.href instead of axios
    const baseURL = (import.meta.env as { VITE_API_BASE_URL?: string }).VITE_API_BASE_URL || 'http://localhost:3000/api';
    return `${baseURL}/auth/facebook`;
  },
};

export default authApi;
