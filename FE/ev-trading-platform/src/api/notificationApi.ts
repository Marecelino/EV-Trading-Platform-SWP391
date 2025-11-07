import axiosClient from './axiosClient';
import { Notification, PaginatedNotificationsResponse, MarkAllNotificationsReadDto } from '../types/api';

const notificationApi = {
  // Get user notifications with pagination and optional filter
  getUserNotifications: (
    userId: string,
    page: number = 1,
    limit: number = 10,
    is_read?: boolean
  ) => {
    const params: Record<string, string | number> = {
      page,
      limit,
    };
    
    if (is_read !== undefined) {
      params.is_read = is_read;
    }
    
    return axiosClient.get<PaginatedNotificationsResponse>(
      `/notifications/user/${userId}`,
      { params }
    );
  },

  // Mark single notification as read
  markAsRead: (notificationId: string) => {
    return axiosClient.patch<Notification>(`/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read for a user
  markAllAsRead: (data: MarkAllNotificationsReadDto) => {
    return axiosClient.post<{ success: boolean }>('/notifications/mark-all', data);
  },

  // Delete a notification
  deleteNotification: (notificationId: string) => {
    return axiosClient.delete(`/notifications/${notificationId}`);
  },

  // Get single notification by ID
  getNotificationById: (notificationId: string) => {
    return axiosClient.get<Notification>(`/notifications/${notificationId}`);
  },
};

export default notificationApi;

