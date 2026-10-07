import { apiClient } from './client';
import { ChatConversation, ChatMessage } from '../types/api';

export async function listConversations(): Promise<ChatConversation[]> {
  const { data } = await apiClient.get<ChatConversation[]>('/chat/conversations');
  return data;
}

export async function getChatUnreadCount(): Promise<{ count: number }> {
  const { data } = await apiClient.get<{ count: number }>('/chat/unread-count');
  return data;
}

export async function getMessagesWith(userId: string): Promise<ChatMessage[]> {
  const { data } = await apiClient.get<ChatMessage[]>(`/chat/with/${userId}`);
  return data;
}

export async function sendMessageRest(receiverId: string, content: string): Promise<ChatMessage> {
  const { data } = await apiClient.post<ChatMessage>('/chat', { receiverId, content });
  return data;
}

export async function getUserOnlineStatus(userId: string): Promise<{ isOnline: boolean }> {
  const { data } = await apiClient.get<{ isOnline: boolean }>(`/chat/online/${userId}`);
  return data;
}
