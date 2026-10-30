import { apiClient } from './client';
import type { NotificationItem, UnreadCountResponse } from '../types';

export const notificationsApi = {
  getNotifications: async (unreadOnly = false): Promise<NotificationItem[]> => {
    const res = await apiClient.get<NotificationItem[]>('/notifications', {
      params: { unread_only: unreadOnly },
    });
    return res.data;
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const res = await apiClient.get<UnreadCountResponse>('/notifications/unread-count');
    return res.data;
  },

  markAsRead: async (notificationId: number): Promise<NotificationItem> => {
    const res = await apiClient.patch<NotificationItem>(`/notifications/${notificationId}/read`);
    return res.data;
  },

  markAllAsRead: async (): Promise<{ detail: string; marked_count: number }> => {
    const res = await apiClient.post<{ detail: string; marked_count: number }>('/notifications/mark-all-read');
    return res.data;
  },
};
