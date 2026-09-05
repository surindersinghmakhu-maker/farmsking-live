import { apiClient } from './client';
import { AdminChatMessage } from '../types/api';

export interface SendChatMessagePayload {
  farmerId?: string;
  message: string;
  imageUrl?: string;
}

export async function sendAdminChatMessage(payload: SendChatMessagePayload): Promise<{ message: string; data: AdminChatMessage }> {
  const res = await apiClient.post<{ message: string; data: AdminChatMessage }>('/admin-chat/send', payload);
  return res.data;
}

export async function fetchMyAdminChatMessages(): Promise<{ messages: AdminChatMessage[]; unreadCount: number }> {
  const res = await apiClient.get<{ messages: AdminChatMessage[]; unreadCount: number }>('/admin-chat/my-messages');
  return res.data;
}

export async function fetchAdminConversations(): Promise<any[]> {
  const res = await apiClient.get<any[]>('/admin-chat/admin/conversations');
  return res.data;
}

export async function fetchAdminFarmerThread(farmerId: string): Promise<{ farmer: any; messages: AdminChatMessage[] }> {
  const res = await apiClient.get<{ farmer: any; messages: AdminChatMessage[] }>(`/admin-chat/admin/conversations/${farmerId}`);
  return res.data;
}

export async function resolveAdminFarmerThread(farmerId: string, notes?: string): Promise<{ message: string; data: AdminChatMessage }> {
  const res = await apiClient.post<{ message: string; data: AdminChatMessage }>(
    `/admin-chat/admin/conversations/${farmerId}/resolve`,
    { notes }
  );
  return res.data;
}

