import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import notificationApi from '../api/notificationApi';
import { Notification } from '../types/api';
import { toast } from 'react-toastify';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  loadNotifications: (page?: number) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // SSE connection
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Load notifications with pagination
  const loadNotifications = useCallback(async (page: number = 1) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await notificationApi.getUserNotifications(user._id, page, 10);
      const { data, meta } = response.data;
      
      if (page === 1) {
        setNotifications(data);
      } else {
        setNotifications(prev => [...prev, ...data]);
      }
      
      setCurrentPage(meta.page);
      setHasMore(meta.page < meta.totalPages);
      
      // Calculate unread count
      const unread = data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refresh notifications (reload page 1)
  const refreshNotifications = useCallback(async () => {
    await loadNotifications(1);
  }, [loadNotifications]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    
    try {
      await notificationApi.markAllAsRead({ user_id: user._id });
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      
      setUnreadCount(0);
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Không thể đánh dấu tất cả là đã đọc');
    }
  }, [user]);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationApi.deleteNotification(id);
      
      // Update local state
      const deletedNotif = notifications.find(n => n._id === id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      
      // Update unread count if deleted notification was unread
      if (deletedNotif && !deletedNotif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      toast.success('Đã xóa thông báo');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Không thể xóa thông báo');
    }
  }, [notifications]);

  // Connect to SSE stream
  const connectSSE = useCallback(() => {
    if (!user || eventSourceRef.current) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      console.log('Connecting to SSE stream...');
      
      // Create EventSource with token
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const url = `${baseURL}/notifications/stream`;
      
      // Note: EventSource doesn't support custom headers directly
      // The backend should accept token via query parameter or use cookie-based auth
      // For now, we'll append token as query param
      const eventSource = new EventSource(`${url}?token=${token}`);
      
      eventSource.onopen = () => {
        console.log('SSE connection opened');
        reconnectAttempts.current = 0;
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle heartbeat
          if (data.type === 'heartbeat') {
            console.log('SSE heartbeat received');
            return;
          }
          
          // New notification received
          console.log('New notification received:', data);
          
          // Add to notifications list
          setNotifications(prev => [data, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast notification
          toast.info(data.message, {
            onClick: () => {
              if (data.action_url) {
                window.location.href = data.action_url;
              }
            },
            autoClose: 5000,
          });
          
          // Play sound for important notifications
          if (data.type === 'win_auction') {
            // Optional: play notification sound
            // new Audio('/notification.mp3').play();
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        eventSource.close();
        eventSourceRef.current = null;
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectAttempts.current += 1;
            connectSSE();
          }, delay);
        } else {
          console.error('Max reconnect attempts reached');
          toast.error('Mất kết nối với server. Vui lòng tải lại trang.');
        }
      };
      
      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('Error creating SSE connection:', error);
    }
  }, [user]);

  // Disconnect from SSE stream
  const disconnectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('Disconnecting SSE...');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    reconnectAttempts.current = 0;
  }, []);

  // Setup SSE connection when user logs in
  useEffect(() => {
    if (user) {
      connectSSE();
      loadNotifications(1);
    } else {
      disconnectSSE();
      setNotifications([]);
      setUnreadCount(0);
    }

    return () => {
      disconnectSSE();
    };
  }, [user, connectSSE, disconnectSSE, loadNotifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    hasMore,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

