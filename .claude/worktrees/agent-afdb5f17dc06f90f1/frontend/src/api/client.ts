import axios from 'axios';
import * as Storage from '../lib/storage';
import { API_BASE_URL, getActiveApiUrl } from '../constants/config';

export const TOKEN_KEY = 'farmsking_access_token';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

let isBaseUrlInitialized = false;

// Request interceptor to attach Auth token and dynamically sync baseURL on startup
apiClient.interceptors.request.use(async (config) => {
  if (!isBaseUrlInitialized) {
    try {
      const activeUrl = await getActiveApiUrl();
      apiClient.defaults.baseURL = activeUrl;
      isBaseUrlInitialized = true;
    } catch {
      // keep current baseURL
    }
  }

  if (apiClient.defaults.baseURL) {
    config.baseURL = apiClient.defaults.baseURL;
  }

  const token = await Storage.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function setApiBaseUrl(newBaseUrl: string) {
  apiClient.defaults.baseURL = newBaseUrl;
  isBaseUrlInitialized = true;
}

/** Resolves a server-relative path (e.g. an uploaded photo's `/uploads/xxx.jpg`) against the API host, so <Image> can load it. Absolute URLs pass through unchanged. */
export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|data:|blob:|file:)/i.test(path)) return path;
  const base = apiClient.defaults.baseURL || API_BASE_URL;
  const origin = base.replace(/\/api\/v1\/?$/, '');
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Tests connection to backend server at specified or active baseURL
 */
export async function testServerConnection(customBaseUrl?: string): Promise<{ success: boolean; message: string; url: string }> {
  const targetUrl = customBaseUrl || apiClient.defaults.baseURL || API_BASE_URL;
  try {
    const response = await axios.get(`${targetUrl.replace(/\/+$/, '')}/health`, {
      timeout: 5000,
    });
    if (response.status === 200 && response.data?.status === 'ok') {
      return { success: true, message: 'Server connected successfully!', url: targetUrl };
    }
    return { success: true, message: 'Connected to server!', url: targetUrl };
  } catch (err: any) {
    let errorMsg = 'Could not reach server.';
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      errorMsg = 'Connection timed out. Check IP & Wi-Fi network.';
    } else if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
      errorMsg = 'Network Error. Check if backend server is running & IP is correct.';
    } else if (err.response?.status) {
      return { success: true, message: `Server responded with status ${err.response.status}`, url: targetUrl };
    }
    return { success: false, message: errorMsg, url: targetUrl };
  }
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);
