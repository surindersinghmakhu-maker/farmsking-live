import { apiClient } from './client';

export interface MandiPredictionItem {
  id: string;
  cropName: string;
  mandiName: string;
  predictedDate: string;
  predictedPrice: string;
  confidenceScore: number;
}

export interface PriceLockContractItem {
  id: string;
  cropName: string;
  quantityQuintal: string;
  lockedRate: string;
  status: string;
  escrowDeposit: string;
  createdAt: string;
  farmer: { id: string; name: string; kingId: string };
  buyer: { id: string; name: string; kingId: string };
}

export async function get30DayPricePredictions(cropName: string = 'Wheat', mandiName: string = 'Khanna'): Promise<MandiPredictionItem[]> {
  const { data } = await apiClient.get<MandiPredictionItem[]>('/mandi-ai/predictions', {
    params: { cropName, mandiName },
  });
  return data;
}

export async function createPriceLockContract(payload: { cropName: string; quantityQuintal: number; lockedRate: number; buyerId?: string }) {
  const { data } = await apiClient.post('/mandi-ai/price-lock', payload);
  return data;
}

export async function getMyPriceLocks(): Promise<PriceLockContractItem[]> {
  const { data } = await apiClient.get<PriceLockContractItem[]>('/mandi-ai/price-locks');
  return data;
}
