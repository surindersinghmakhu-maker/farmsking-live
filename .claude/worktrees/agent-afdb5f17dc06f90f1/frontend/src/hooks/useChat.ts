import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/chat.api';
import { getChatSocket } from '../lib/socket';
import { ChatMessage } from '../types/api';

export function useConversations() {
  return useQuery({ queryKey: ['chat', 'conversations'], queryFn: api.listConversations, refetchInterval: 20_000 });
}

export function useChatUnreadCount() {
  return useQuery({ queryKey: ['chat', 'unread-count'], queryFn: api.getChatUnreadCount, refetchInterval: 20_000 });
}

/** Message history for one thread, kept live via the shared chat WebSocket. */
export function useChatThread(otherUserId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['chat', 'with', otherUserId];

  const query = useQuery({
    queryKey,
    queryFn: () => api.getMessagesWith(otherUserId as string),
    enabled: !!otherUserId,
  });

  useEffect(() => {
    if (!otherUserId) return;
    let cancelled = false;
    let detach: (() => void) | undefined;

    getChatSocket().then((socket) => {
      if (cancelled) return;
      const handler = (message: ChatMessage) => {
        if (message.senderId !== otherUserId && message.receiverId !== otherUserId) return;
        queryClient.setQueryData<ChatMessage[]>(queryKey, (prev) => {
          if (!prev) return [message];
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
        queryClient.invalidateQueries({ queryKey: ['chat', 'unread-count'] });
      };
      socket.on('new_message', handler);
      detach = () => socket.off('new_message', handler);
    });

    return () => {
      cancelled = true;
      detach?.();
    };
  }, [otherUserId, queryClient]);

  const sendMessage = async (content: string) => {
    if (!otherUserId || !content.trim()) return;
    const socket = await getChatSocket();
    socket.emit('send_message', { receiverId: otherUserId, content: content.trim() });
  };

  return { ...query, sendMessage };
}
