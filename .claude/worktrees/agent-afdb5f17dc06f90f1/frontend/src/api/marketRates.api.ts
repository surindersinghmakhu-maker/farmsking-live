import { apiClient } from './client';

export interface CropRateSummary {
  cropName: string;
  unit: string;
  localAvgRate: number | null;
  localSampleCount: number;
  nationalAvgRate: number | null;
  nationalSampleCount: number;
}

export interface MyCropRatesResponse {
  state: string | null;
  rates: CropRateSummary[];
}

export async function getMyCropRates(): Promise<MyCropRatesResponse> {
  const { data } = await apiClient.get<MyCropRatesResponse>('/market-rates/my-crops');
  return data;
}
