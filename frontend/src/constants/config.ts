import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Storage from '../lib/storage';

export const CUSTOM_API_URL_KEY = 'farmsking_custom_api_url';

/**
 * Extracts Metro developer host IP from Expo Constants if available
 * (e.g. "192.168.1.15" when running via Expo Go on physical device or emulator).
 */
export function getAutoDetectedHostIp(): string | null {
  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any).manifest?.debuggerHost ||
      (Constants as any).manifest2?.extra?.expoGo?.developer?.extra?.hostUri;

    if (hostUri && typeof hostUri === 'string') {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }
  } catch (err) {
    console.warn('Could not auto-detect Expo host IP:', err);
  }
  return null;
}

/**
 * Normalizes input string (e.g. "192.168.1.15", "192.168.1.15:4100", "http://192.168.1.15:4100")
 * into a full backend API base URL string ("http://192.168.1.15:4100/api/v1").
 */
export function normalizeApiUrl(rawInput: string): string {
  let cleaned = rawInput.trim();
  if (!cleaned) return getDefaultApiUrl();

  // Add http protocol if missing
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `http://${cleaned}`;
  }

  // Remove trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');

  // Add port 4100 if no port specified — but only for http:// (local network dev servers).
  // https:// hosts (tunnels like loca.lt / trycloudflare.com) always serve on the standard 443
  // port; forcing :4100 onto them breaks the connection entirely.
  const urlObjPattern = /^(https?:\/\/)([^/:]+)(?::(\d+))?(.*)$/i;
  const match = cleaned.match(urlObjPattern);

  if (match) {
    const protocol = match[1];
    const host = match[2];
    const port = match[3];
    let path = match[4] || '';

    const isHttps = /^https:\/\//i.test(protocol);
    const effectivePort = port ? port : isHttps ? '' : '3000';

    if (!path || path === '/') {
      path = '/api/v1';
    } else if (!path.includes('/api/')) {
      path = `${path.replace(/\/+$/, '')}/api/v1`;
    }

    return `${protocol}${host}${effectivePort ? `:${effectivePort}` : ''}${path}`;
  }

  return cleaned;
}

/**
 * Calculates standard default API URL based on environment & device type
 */
export function getDefaultApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    if (Platform.OS !== 'web' && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      return envUrl.replace(/localhost|127\.0\.0\.1/g, '192.168.1.79');
    }
    return envUrl;
  }

  // Permanent 24/7 Railway Cloud Server (No GitHub required, 24/7 Online)
  return 'https://farmsking-backend-production.up.railway.app/api/v1';
}

// Initial default API URL
export const API_BASE_URL = getDefaultApiUrl();

/**
 * Retrieves stored API URL or default
 */
export async function getActiveApiUrl(): Promise<string> {
  try {
    const stored = await Storage.getItemAsync(CUSTOM_API_URL_KEY);
    if (stored && stored.trim()) {
      const normalized = normalizeApiUrl(stored);

      // On HTTPS Web (e.g. Vercel), ignore unencrypted http:// URLs or obsolete render.com URLs
      // to prevent browser Mixed Content blocking and network errors
      const isHttpsWeb = Platform.OS === 'web' && typeof window !== 'undefined' && window.location.protocol === 'https:';
      if ((isHttpsWeb && normalized.startsWith('http://')) || normalized.includes('onrender.com')) {
        await Storage.deleteItemAsync(CUSTOM_API_URL_KEY);
        return getDefaultApiUrl();
      }

      return normalized;
    }
  } catch (err) {
    console.warn('Error reading stored API URL:', err);
  }
  return getDefaultApiUrl();
}

/**
 * Saves custom API URL
 */
export async function saveCustomApiUrl(url: string): Promise<string> {
  const normalized = normalizeApiUrl(url);
  await Storage.setItemAsync(CUSTOM_API_URL_KEY, normalized);
  return normalized;
}

/**
 * Clears custom API URL (resets to default)
 */
export async function resetCustomApiUrl(): Promise<string> {
  await Storage.deleteItemAsync(CUSTOM_API_URL_KEY);
  return getDefaultApiUrl();
}
