import { useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as notificationsApi from '../api/notifications.api';

export function useMyNotifications() {
  return useQuery({
    queryKey: ['notifications', 'mine'],
    queryFn: notificationsApi.listMyNotifications,
    refetchInterval: 30_000,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Shows a blocking alert for the newest unread advisor reminder (SPRAY_REMINDER with data.isReminder)
 * the moment the app loads — mount once near the top of a role's home screen. Fires at most once per
 * mount so re-renders don't re-pop the same alert.
 */
export function useReminderAlertOnLoad(enabled: boolean) {
  const { data: notifications } = useMyNotifications();
  const markRead = useMarkNotificationRead();
  const hasShown = useRef(false);

  useEffect(() => {
    if (!enabled || hasShown.current || !notifications) return;

    const reminder = notifications.find((n) => n.type === 'SPRAY_REMINDER' && !n.isRead && n.data?.isReminder === true);
    if (!reminder) return;

    hasShown.current = true;
    markRead.mutate(reminder.id);

    if (Platform.OS === 'web') {
      alert(`${reminder.title}\n\n${reminder.body}`);
    } else {
      Alert.alert(reminder.title, reminder.body);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, notifications]);
}
