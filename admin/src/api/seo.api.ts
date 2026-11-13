import { apiClient } from './client';

export interface SeoStatusResponse {
  lastSubmittedAt: string | null;
  urlsCount: number;
  accepted: boolean;
  frequency: string;
  endpoints: Record<string, { statusCode?: number; statusMessage?: string; error?: string }>;
  nextScheduledSubmissionAt: string | null;
}

export async function getSeoStatusApi(): Promise<SeoStatusResponse> {
  const { data } = await apiClient.get<SeoStatusResponse>('/seo/status');
  return data;
}

export async function triggerSeoSubmitApi(): Promise<{ message: string; report: SeoStatusResponse }> {
  const { data } = await apiClient.post<{ message: string; report: SeoStatusResponse }>('/seo/submit');
  return data;
}
