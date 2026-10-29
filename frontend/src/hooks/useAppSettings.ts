import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/appSettings.api';

export function updateWebFavicon(url?: string | null) {
  if (typeof document === 'undefined' || !url) return;
  try {
    const resolvedUrl = url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')
      ? url
      : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;

    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = resolvedUrl;

    let shortcutLink = document.querySelector("link[rel='shortcut icon']") as HTMLLinkElement | null;
    if (!shortcutLink) {
      shortcutLink = document.createElement('link');
      shortcutLink.rel = 'shortcut icon';
      document.head.appendChild(shortcutLink);
    }
    shortcutLink.href = resolvedUrl;

    const appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
    if (appleLink) {
      appleLink.href = resolvedUrl;
    }
  } catch (e) {
    // ignore
  }
}

export function useAppSettings() {
  const query = useQuery({
    queryKey: ['app-settings'],
    queryFn: api.getAppSettings,
  });

  useEffect(() => {
    if (query.data?.faviconUrl) {
      updateWebFavicon(query.data.faviconUrl);
    }
  }, [query.data?.faviconUrl]);

  return query;
}

export function useSupportContact() {
  const query = useQuery({
    queryKey: ['app-settings', 'support-contact'],
    queryFn: api.getSupportContact,
  });

  useEffect(() => {
    if ((query.data as any)?.faviconUrl) {
      updateWebFavicon((query.data as any).faviconUrl);
    }
  }, [(query.data as any)?.faviconUrl]);

  return query;
}

export function useUpdateAppSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.UpdateAppSettingsPayload) => api.updateAppSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      queryClient.invalidateQueries({ queryKey: ['app-settings', 'support-contact'] });
    },
  });
}
