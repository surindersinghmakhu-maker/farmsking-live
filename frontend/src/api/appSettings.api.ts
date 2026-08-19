import { apiClient } from './client';

export interface AppSettings {
  id: string;
  appName: string;
  logoUrl: string | null;
  tagline: string | null;
  upiId: string | null;
  upiPayeeName: string | null;
  updatedAt: string;
  updatedById: string | null;
}

export interface UpdateAppSettingsPayload {
  appName?: string;
  logoUrl?: string;
  tagline?: string;
  upiId?: string;
  upiPayeeName?: string;
}

export async function getAppSettings(): Promise<AppSettings> {
  const { data } = await apiClient.get<AppSettings>('/app-settings');
  return data;
}

export async function updateAppSettings(payload: UpdateAppSettingsPayload): Promise<AppSettings> {
  const { data } = await apiClient.patch<AppSettings>('/app-settings', payload);
  return data;
}

export interface SupportContact {
  name: string;
  mobile: string;
  email: string | null;
}

export async function getSupportContact(): Promise<SupportContact> {
  const { data } = await apiClient.get<SupportContact>('/app-settings/support-contact');
  return data;
}
