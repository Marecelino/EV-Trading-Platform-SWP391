// src/contexts/AuthContext.tsx
import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';
import authApi from '../api/authApi';

// Định nghĩa kiểu dữ liệu User
interface User {
  _id: string;
  email: string;
  full_name: string;
  role: 'member' | 'admin';
  picture?: string;
}

// Định nghĩa những gì Context sẽ cung cấp
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  googleLogin: (credential: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(false);


  const login = async (email: string, password: string): Promise<User> => { 
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);
      if (response.data.success) {
        const { user: loggedInUser, token: newToken } = response.data.data;
        setUser(loggedInUser);
        setToken(newToken);
        localStorage.setItem('token', newToken);
        return loggedInUser; 
      }
      
      throw new Error(response.data.message || 'Đăng nhập thất bại');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Lỗi không xác định');
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (credential: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authApi.googleLogin(credential);
      if (response.data.success) {
        const { user: loggedInUser, token: newToken } = response.data.data;
        setUser(loggedInUser);
        setToken(newToken);
        localStorage.setItem('token', newToken);
        return loggedInUser;
      }
      
      throw new Error(response.data.message || 'Đăng nhập Google thất bại');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Lỗi đăng nhập Google');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const value = { user, token, login, googleLogin, logout, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};