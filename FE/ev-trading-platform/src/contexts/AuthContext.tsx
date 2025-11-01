import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '../types';
import authApi from '../api/authApi';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  completeSocialLogin: (token: string) => Promise<User>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await authApi.getProfile();
          console.log("=== AUTH PROFILE RESPONSE ===");
          console.log("Full response:", response);
          console.log("Response data:", response.data);
          
          // CRITICAL FIX: Improve response parsing to handle nested structures
          let userData = null;
          if (response.data?.data && typeof response.data.data === 'object') {
            userData = response.data.data;
          } else if (response.data && typeof response.data === 'object') {
            userData = response.data;
          }
          
          if (userData) {
            setUser(userData);
          } else {
            console.warn("No valid user data found in profile response");
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Failed to fetch profile', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // CRITICAL FIX: Implement completeSocialLogin for OAuth callback
  const completeSocialLogin = async (token: string): Promise<User> => {
    // Store the token first
    localStorage.setItem('token', token);
    setToken(token);
    
    // Fetch user profile
    try {
      const response = await authApi.getProfile();
      console.log("=== SOCIAL LOGIN PROFILE RESPONSE ===");
      console.log("Full response:", response);
      console.log("Response data:", response.data);
      
      // CRITICAL FIX: Improve response parsing to handle nested structures
      let userData = null;
      if (response.data?.data && typeof response.data.data === 'object') {
        userData = response.data.data;
      } else if (response.data && typeof response.data === 'object') {
        userData = response.data;
      }
      
      if (userData) {
        setUser(userData);
        return userData;
      } else {
        throw new Error('No valid user data found in profile response');
      }
    } catch (error) {
      console.error('Failed to complete social login', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, completeSocialLogin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
