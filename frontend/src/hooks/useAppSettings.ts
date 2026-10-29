import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/appSettings.api';

export function updateWebFavicon(url?: string | null) {
  if (typeof document === 'undefined') return;
  try {
    const rawUrl = url || '/favicon.png';
    const resolvedUrl = rawUrl.startsWith('http') || rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')
      ? rawUrl
      : `${window.location.origin}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

    const pngUrl = resolvedUrl.endsWith('.ico') ? resolvedUrl.replace('.ico', '.png') : resolvedUrl;

    // 1. Standard rel="icon" PNG
    let linkPng = document.querySelector("link[rel='icon'][type='image/png']") as HTMLLinkElement | null;
    if (!linkPng) {
      linkPng = document.createElement('link');
      linkPng.rel = 'icon';
      linkPng.type = 'image/png';
      document.head.appendChild(linkPng);
    }
    linkPng.href = pngUrl;

    // 2. Generic rel="icon"
    let link = document.querySelector("link[rel='icon']:not([type='image/png'])") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = resolvedUrl;

    // 3. rel="shortcut icon"
    let shortcutLink = document.querySelector("link[rel='shortcut icon']") as HTMLLinkElement | null;
    if (!shortcutLink) {
      shortcutLink = document.createElement('link');
      shortcutLink.rel = 'shortcut icon';
      document.head.appendChild(shortcutLink);
    }
    shortcutLink.href = resolvedUrl;

    // 4. rel="apple-touch-icon"
    let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleLink);
    }
    appleLink.href = pngUrl;
  } catch (e) {
    // ignore
  }
}

// Immediately ensure official favicon on browser execution
if (typeof document !== 'undefined') {
  updateWebFavicon();
}

export function AppFaviconGlobalizer() {
  useAppSettings();
  return null;
}

export function useAppSettings() {
  const query = useQuery({
    queryKey: ['app-settings'],
    queryFn: api.getAppSettings,
  });

  useEffect(() => {
    updateWebFavicon(query.data?.faviconUrl || '/favicon.png');
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
