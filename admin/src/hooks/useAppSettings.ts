import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/appSettings.api';

export function updateWebFavicon(url?: string | null) {
  if (typeof document === 'undefined') return;
  try {
    let rawUrl = url || '/favicon.png';
    if (rawUrl.includes('localhost:3000') || rawUrl.includes('192.168.1.79') || rawUrl.includes('/uploads/')) {
      rawUrl = '/favicon.png';
    }
    const versionedPng = rawUrl.includes('?') ? rawUrl : `${rawUrl}?v=7`;
    const resolvedUrl = versionedPng.startsWith('http') || versionedPng.startsWith('blob:') || versionedPng.startsWith('data:')
      ? versionedPng
      : `${window.location.origin}${versionedPng.startsWith('/') ? '' : '/'}${versionedPng}`;

    const pngUrl = resolvedUrl.endsWith('.ico') ? resolvedUrl.replace('.ico', '.png') : resolvedUrl;

    // 1. Update ALL existing rel="icon" tags so sizes="192x192" / "512x512" never fall back to stale cache
    const iconLinks = document.querySelectorAll("link[rel='icon']") as NodeListOf<HTMLLinkElement>;
    if (iconLinks.length === 0) {
      const created = document.createElement('link');
      created.rel = 'icon';
      created.type = 'image/png';
      created.href = pngUrl;
      document.head.appendChild(created);
    } else {
      iconLinks.forEach((lnk) => {
        lnk.type = 'image/png';
        lnk.href = pngUrl;
      });
    }

    // 2. rel="shortcut icon"
    let shortcutLink = document.querySelector("link[rel='shortcut icon']") as HTMLLinkElement | null;
    if (!shortcutLink) {
      shortcutLink = document.createElement('link');
      shortcutLink.rel = 'shortcut icon';
      document.head.appendChild(shortcutLink);
    }
    shortcutLink.href = resolvedUrl.includes('/favicon.png')
      ? resolvedUrl.replace('/favicon.png', '/favicon.ico')
      : pngUrl;

    // 3. rel="apple-touch-icon"
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

export function syncAdminDocumentTitle() {
  if (typeof document === 'undefined') return;
  const desired = 'FarmsKing - Admin Staff';
  if (document.title !== desired) {
    document.title = desired;
  }
}

// Immediately ensure official favicon and Admin Staff title on browser execution
if (typeof document !== 'undefined') {
  updateWebFavicon();
  syncAdminDocumentTitle();
}

export function AppFaviconGlobalizer() {
  useAppSettings();
  useEffect(() => {
    if (typeof document === 'undefined') return;
    syncAdminDocumentTitle();
    const titleEl = document.querySelector('title');
    if (!titleEl || typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => syncAdminDocumentTitle());
    observer.observe(titleEl, { childList: true, characterData: true, subtree: true });
    window.addEventListener('popstate', syncAdminDocumentTitle);
    return () => {
      observer.disconnect();
      window.removeEventListener('popstate', syncAdminDocumentTitle);
    };
  }, []);
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

export function useVisitorStats() {
  return useQuery({
    queryKey: ['app-settings', 'visitor-stats'],
    queryFn: api.getVisitorStats,
    refetchInterval: 15000,
  });
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
