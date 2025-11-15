import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiErrorResponse } from '../types/api';

const axiosClient = axios.create({
  baseURL: (import.meta.env as { VITE_API_BASE_URL?: string }).VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, 
});

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // DEBUG: Log request details (skip for login to avoid logging password)
    if (!config.url?.includes('/auth/login')) {
      console.log("=== AXIOS REQUEST ===", config.method?.toUpperCase(), config.url);
    } else {
      console.log("=== AXIOS REQUEST ===", config.method?.toUpperCase(), config.url);
      console.log("Request headers:", config.headers);
      console.log("Request data:", config.data ? { ...config.data, password: "***" } : config.data);
    }
    
    return config;
  },
  (error) => {
    console.error("=== AXIOS REQUEST ERROR ===", error);
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors and 401 redirects
axiosClient.interceptors.response.use(
  (response) => {
    // DEBUG: Log successful responses for login
    if (response.config.url?.includes('/auth/login')) {
      console.log("=== AXIOS RESPONSE (SUCCESS) ===");
      console.log("Status:", response.status);
      console.log("Status text:", response.statusText);
      console.log("Headers:", response.headers);
      console.log("Data:", response.data);
    }
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    // DEBUG: Enhanced error logging
    console.error("=== AXIOS RESPONSE (ERROR) ===");
    console.error("Error status:", error.response?.status);
    console.error("Error statusText:", error.response?.statusText);
    console.error("Error URL:", error.config?.url);
    console.error("Error method:", error.config?.method);
    console.error("Error headers:", error.response?.headers);
    console.error("Error data:", error.response?.data);
    console.error("Error request:", error.request);
    console.error("Full error object:", error);
    
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if not already on login/register page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        window.location.href = '/login';
      }
    }

    // Return error with better structure
    const apiError = error.response?.data || {
      message: error.message || 'An error occurred',
      statusCode: error.response?.status || 500,
    };

    return Promise.reject(apiError);
  }
);

export default axiosClient;
