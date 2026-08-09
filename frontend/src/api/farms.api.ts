import { apiClient } from './client';
import { AreaUnit, Farm } from '../types/api';

export interface CreateFarmPayload {
  name: string;
  village?: string;
  district?: string;
  state?: string;
  totalArea: number;
  areaUnit?: AreaUnit;
  soilType?: string;
  irrigationSource?: string;
  notes?: string;
}

export type UpdateFarmPayload = Partial<CreateFarmPayload>;

export async function listFarms(): Promise<Farm[]> {
  const { data } = await apiClient.get<Farm[]>('/farms');
  return data;
}

export async function getFarm(id: string): Promise<Farm> {
  const { data } = await apiClient.get<Farm>(`/farms/${id}`);
  return data;
}

export async function createFarm(payload: CreateFarmPayload): Promise<Farm> {
  const { data } = await apiClient.post<Farm>('/farms', payload);
  return data;
}

export async function updateFarm(id: string, payload: UpdateFarmPayload): Promise<Farm> {
  const { data } = await apiClient.patch<Farm>(`/farms/${id}`, payload);
  return data;
}

export async function deleteFarm(id: string): Promise<void> {
  await apiClient.delete(`/farms/${id}`);
}
