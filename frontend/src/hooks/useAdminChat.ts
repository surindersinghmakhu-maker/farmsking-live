import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMyAdminChatMessages,
  sendAdminChatMessage,
  fetchAdminConversations,
  fetchAdminFarmerThread,
  resolveAdminFarmerThread,
  SendChatMessagePayload,
} from '../api/admin-chat.api';
import { getChatSocket } from '../lib/socket';

export function useMyAdminChatMessages() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    getChatSocket().then((socket) => {
      if (!active) return;
      const handleNewMsg = () => {
        queryClient.invalidateQueries({ queryKey: ['adminChatMessages'] });
        queryClient.invalidateQueries({ queryKey: ['adminConversations'] });
        queryClient.invalidateQueries({ queryKey: ['adminFarmerThread'] });
      };
      socket.on('admin_chat_message', handleNewMsg);
      return () => {
        socket.off('admin_chat_message', handleNewMsg);
      };
    });
    return () => {
      active = false;
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['adminChatMessages'],
    queryFn: fetchMyAdminChatMessages,
    refetchInterval: 15_000,
  });
}

export function useAdminConversations() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    getChatSocket().then((socket) => {
      if (!active) return;
      const handleNewMsg = () => {
        queryClient.invalidateQueries({ queryKey: ['adminConversations'] });
      };
      socket.on('admin_chat_message', handleNewMsg);
      return () => {
        socket.off('admin_chat_message', handleNewMsg);
      };
    });
    return () => {
      active = false;
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['adminConversations'],
    queryFn: fetchAdminConversations,
    refetchInterval: 15_000,
  });
}

export function useAdminFarmerThread(farmerId?: string) {
  return useQuery({
    queryKey: ['adminFarmerThread', farmerId],
    queryFn: () => (farmerId ? fetchAdminFarmerThread(farmerId) : Promise.resolve(null)),
    enabled: !!farmerId,
    refetchInterval: 15_000,
  });
}

export function useSendAdminChatMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendChatMessagePayload) => sendAdminChatMessage(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminChatMessages'] });
      queryClient.invalidateQueries({ queryKey: ['adminConversations'] });
      if (variables.farmerId) {
        queryClient.invalidateQueries({ queryKey: ['adminFarmerThread', variables.farmerId] });
      }
    },
  });
}

export function useResolveAdminFarmerThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ farmerId, notes }: { farmerId: string; notes?: string }) =>
      resolveAdminFarmerThread(farmerId, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminChatMessages'] });
      queryClient.invalidateQueries({ queryKey: ['adminConversations'] });
      if (variables.farmerId) {
        queryClient.invalidateQueries({ queryKey: ['adminFarmerThread', variables.farmerId] });
      }
    },
  });
}

