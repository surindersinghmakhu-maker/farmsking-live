import { apiClient } from './client';
import { CropCategory, CropCycle, CropStatus } from '../types/api';

export interface CreateCropPayload {
  plotId: string;
  category?: CropCategory;
  cropName: string;
  variety?: string;
  area?: number;
  plantCount?: number;
  sowingDate?: string;
  transplantDate?: string;
  expectedHarvestDate?: string;
  actualHarvestDate?: string;
  status?: CropStatus;
  notes?: string;
}

export type UpdateCropPayload = Partial<Omit<CreateCropPayload, 'plotId'>>;

export async function listCropsForPlot(plotId: string): Promise<CropCycle[]> {
  const { data } = await apiClient.get<CropCycle[]>(`/crops/plot/${plotId}`);
  return data;
}

export async function getCrop(id: string): Promise<CropCycle> {
  const { data } = await apiClient.get<CropCycle>(`/crops/${id}`);
  return data;
}

export async function createCrop(payload: CreateCropPayload): Promise<CropCycle> {
  const { data } = await apiClient.post<CropCycle>('/crops', payload);
  return data;
}

export async function updateCrop(id: string, payload: UpdateCropPayload): Promise<CropCycle> {
  const { data } = await apiClient.patch<CropCycle>(`/crops/${id}`, payload);
  return data;
}

export async function deleteCrop(id: string): Promise<void> {
  await apiClient.delete(`/crops/${id}`);
}
