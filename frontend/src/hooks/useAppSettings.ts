import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/appSettings.api';

export function updateWebFavicon(url?: string | null) {
  if (typeof document === 'undefined') return;
  try {
    let rawUrl = url || '/favicon.png';
    // Guard against heavy 5MB uploads or legacy dev URLs
    if (rawUrl.includes('localhost:3000') || rawUrl.includes('192.168.1.79') || rawUrl.includes('/uploads/')) {
      rawUrl = '/favicon.png';
    }
    const versionedPng = rawUrl.includes('?') ? rawUrl : `${rawUrl}?v=6`;
    const resolvedUrl = versionedPng.startsWith('http') || versionedPng.startsWith('blob:') || versionedPng.startsWith('data:')
      ? versionedPng
      : `${window.location.origin}${versionedPng.startsWith('/') ? '' : '/'}${versionedPng}`;

    const pngUrl = resolvedUrl;

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
    link.href = pngUrl;

    // 3. rel="shortcut icon"
    let shortcutLink = document.querySelector("link[rel='shortcut icon']") as HTMLLinkElement | null;
    if (!shortcutLink) {
      shortcutLink = document.createElement('link');
      shortcutLink.rel = 'shortcut icon';
      document.head.appendChild(shortcutLink);
    }
    shortcutLink.href = pngUrl;

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
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
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
