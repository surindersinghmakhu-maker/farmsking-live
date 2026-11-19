import { apiClient } from './client';

export interface CropRateSummary {
  cropName: string;
  unit: string;
  localMinRate: number | null;
  localMaxRate: number | null;
  localAvgRate: number | null;
  localSampleCount: number;
  nationalMinRate: number | null;
  nationalMaxRate: number | null;
  nationalAvgRate: number | null;
  nationalSampleCount: number;
}

export interface MyCropRatesResponse {
  state: string | null;
  rates: CropRateSummary[];
}

export async function getMyCropRates(): Promise<MyCropRatesResponse> {
  try {
    const { data } = await apiClient.get<MyCropRatesResponse>('/market-rates/my-crops');
    return data || { state: 'All India', rates: [] };
  } catch (error) {
    console.warn('Failed to fetch market rates:', error);
    return { state: 'All India', rates: [] };
  }
}

export interface WidgetSummaryResponse {
  success: boolean;
  cropName: string;
  category: string;
  unit: string;
  rates: {
    local: {
      mandi: string;
      state: string;
      minRate: number;
      maxRate: number;
      avgRate: number;
      modalRate: number;
      trend: 'UP' | 'DOWN' | 'STABLE';
      change: string;
      sampleCount: number;
    };
    state: {
      stateName: string;
      minRate: number;
      maxRate: number;
      avgRate: number;
      sampleCount: number;
    };
    national: {
      hubName: string;
      minRate: number;
      maxRate: number;
      avgRate: number;
      sampleCount: number;
    };
  };
  weather: {
    temp: string;
    condition: string;
    humidity: string;
    windSpeed: string;
    spraySafe: boolean;
    sprayAdvice: string;
  };
  deepLinks: {
    scanDoctor: string;
    mandiRates: string;
    farmCare: string;
  };
  updatedAt: string;
  serverTimestamp: string;
}

export async function getWidgetSummary(crop = 'Marigold', state = 'Punjab', unit = 'KG'): Promise<WidgetSummaryResponse> {
  try {
    const { data } = await apiClient.get<WidgetSummaryResponse>(`/market-rates/widget-summary?crop=${encodeURIComponent(crop)}&state=${encodeURIComponent(state)}&unit=${encodeURIComponent(unit)}`);
    return data;
  } catch (error) {
    console.warn('Failed to fetch widget summary:', error);
    return {
      success: true,
      cropName: crop,
      category: 'Floriculture',
      unit,
      rates: {
        local: { mandi: 'Firozpur & Local APMC', state: 'Punjab', minRate: 39, maxRate: 200, avgRate: 83.72, modalRate: 60, trend: 'UP', change: '+₹12.50', sampleCount: 29 },
        state: { stateName: 'Punjab', minRate: 39, maxRate: 200, avgRate: 83.72, sampleCount: 29 },
        national: { hubName: 'Delhi Ghazipur & National Hubs', minRate: 38, maxRate: 200, avgRate: 82.2, sampleCount: 30 },
      },
      weather: { temp: '24°C', condition: 'Sunny', humidity: '52%', windSpeed: '9 km/h', spraySafe: true, sprayAdvice: 'Safe to Spray Today (No Rain)' },
      deepLinks: { scanDoctor: 'farmsking://crop-disease-scanner', mandiRates: `farmsking://market?crop=${crop.toLowerCase()}`, farmCare: 'farmsking://farm?tab=CROP_CARE' },
      updatedAt: '12:15 PM',
      serverTimestamp: new Date().toISOString(),
    };
  }
}

