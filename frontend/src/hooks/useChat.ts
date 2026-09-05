import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/chat.api';
import { getChatSocket } from '../lib/socket';
import { ChatConversation, ChatMessage } from '../types/api';

export function useConversations() {
  return useQuery({ queryKey: ['chat', 'conversations'], queryFn: api.listConversations, refetchInterval: 20_000 });
}

/** Live-patches the conversations cache in place as `presence_update` events arrive, so the
 * online/offline dot updates instantly instead of waiting for the next 20s refetch. */
export function useConversationsPresenceSync(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let detach: (() => void) | undefined;

    getChatSocket().then((socket) => {
      if (cancelled) return;
      const handler = ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
        queryClient.setQueryData<ChatConversation[]>(['chat', 'conversations'], (prev) =>
          prev?.map((c) => (c.partner.id === userId ? { ...c, isOnline } : c)),
        );
      };
      socket.on('presence_update', handler);
      detach = () => socket.off('presence_update', handler);
    });

    return () => {
      cancelled = true;
      detach?.();
    };
  }, [enabled, queryClient]);
}

/** Live online/offline status for one specific user (e.g. the chat-thread header), seeded from the
 * REST endpoint and kept fresh via `presence_update` socket events. */
export function useOnlineStatus(userId: string | undefined) {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let detach: (() => void) | undefined;

    api.getUserOnlineStatus(userId).then((res) => {
      if (!cancelled) setIsOnline(res.isOnline);
    });

    getChatSocket().then((socket) => {
      if (cancelled) return;
      const handler = (payload: { userId: string; isOnline: boolean }) => {
        if (payload.userId !== userId) return;
        setIsOnline(payload.isOnline);
      };
      socket.on('presence_update', handler);
      detach = () => socket.off('presence_update', handler);
    });

    return () => {
      cancelled = true;
      detach?.();
    };
  }, [userId]);

  return isOnline;
}

export function useChatUnreadCount(enabled: boolean = true) {
  return useQuery({ queryKey: ['chat', 'unread-count'], queryFn: api.getChatUnreadCount, refetchInterval: 20_000, enabled });
}

/**
 * Keeps the shared chat socket connected and the unread-count/conversations queries fresh in real time,
 * app-wide — not just while a specific thread screen is open. Mount once near the app root.
 */
export function useGlobalChatUnreadSync(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let detach: (() => void) | undefined;

    getChatSocket().then((socket) => {
      if (cancelled) return;
      const handler = () => {
        queryClient.invalidateQueries({ queryKey: ['chat', 'unread-count'] });
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
        queryClient.invalidateQueries({ queryKey: ['adminChatMessages'] });
        queryClient.invalidateQueries({ queryKey: ['adminConversations'] });
        queryClient.invalidateQueries({ queryKey: ['crop-problems'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      };
      socket.on('new_message', handler);
      socket.on('admin_chat_message', handler);
      socket.on('crop_problem_updated', handler);
      detach = () => {
        socket.off('new_message', handler);
        socket.off('admin_chat_message', handler);
        socket.off('crop_problem_updated', handler);
      };
    });

    return () => {
      cancelled = true;
      detach?.();
    };
  }, [enabled, queryClient]);
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

  // Opening a thread marks its unread messages as read server-side — refresh the tab badge and
  // conversation list right away instead of waiting for the next 20s poll.
  useEffect(() => {
    if (!query.isSuccess) return;
    queryClient.invalidateQueries({ queryKey: ['chat', 'unread-count'] });
    queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
  }, [query.isSuccess, query.dataUpdatedAt, queryClient]);

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
    if (!socket.connected) {
      throw new Error('Not connected to chat server. Check your Server IP setting and try again.');
    }
    const ack = await new Promise<{ status: 'ok' | 'error'; message?: string }>((resolve) => {
      socket
        .timeout(8000)
        .emit('send_message', { receiverId: otherUserId, content: content.trim() }, (err: unknown, response: { status: 'ok' | 'error'; message?: string }) => {
          if (err) {
            resolve({ status: 'error', message: 'Message timed out — check your connection.' });
            return;
          }
          resolve(response);
        });
    });
    if (ack.status === 'error') {
      throw new Error(ack.message || 'Could not send message.');
    }
  };

  return { ...query, sendMessage };
}
