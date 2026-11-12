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

export function syncWebDocumentTitle() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const host = window.location.hostname || '';
  const path = window.location.pathname || '';
  const desired =
    host.startsWith('admin.') || path.startsWith('/admin')
      ? 'FarmsKing - Admin Staff'
      : 'FarmsKing - Smart Farming';
  if (document.title !== desired) {
    document.title = desired;
  }
}

// Immediately ensure official favicon and title on browser execution
if (typeof document !== 'undefined') {
  updateWebFavicon();
  syncWebDocumentTitle();
}

export function AppFaviconGlobalizer() {
  useAppSettings();
  useEffect(() => {
    if (typeof document === 'undefined') return;
    syncWebDocumentTitle();
    const titleEl = document.querySelector('title');
    if (!titleEl || typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => syncWebDocumentTitle());
    observer.observe(titleEl, { childList: true, characterData: true, subtree: true });
    window.addEventListener('popstate', syncWebDocumentTitle);
    return () => {
      observer.disconnect();
      window.removeEventListener('popstate', syncWebDocumentTitle);
    };
  }, []);
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
