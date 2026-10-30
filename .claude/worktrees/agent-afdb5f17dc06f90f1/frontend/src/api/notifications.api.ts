import { apiClient } from './client';
import { AppNotification } from '../types/api';

export async function listMyNotifications(): Promise<AppNotification[]> {
  const { data } = await apiClient.get<AppNotification[]>('/notifications');
  return data;
}

export async function getUnreadCount(): Promise<{ count: number }> {
  const { data } = await apiClient.get<{ count: number }>('/notifications/unread-count');
  return data;
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const { data } = await apiClient.patch<AppNotification>(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead(): Promise<{ success: boolean }> {
  const { data } = await apiClient.patch<{ success: boolean }>('/notifications/read-all');
  return data;
}
