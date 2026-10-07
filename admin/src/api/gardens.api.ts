import { apiClient } from './client';

export interface Garden {
  id: string;
  gardenerId: string;
  name: string;
  location?: string | null;
  area?: number | null;
  healthScore: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Plant {
  id: string;
  gardenId: string;
  name: string;
  species?: string | null;
  plantedDate?: string | null;
  healthNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGardenPayload {
  name: string;
  location?: string;
  area?: number;
}

export interface CreatePlantPayload {
  name: string;
  species?: string;
  plantedDate?: string;
  healthNotes?: string;
}

export async function listMyGardens(): Promise<Garden[]> {
  const { data } = await apiClient.get<Garden[]>('/gardens/mine');
  return data;
}

export async function createGarden(payload: CreateGardenPayload): Promise<Garden> {
  const { data } = await apiClient.post<Garden>('/gardens', payload);
  return data;
}

export async function getGarden(id: string): Promise<Garden> {
  const { data } = await apiClient.get<Garden>(`/gardens/${id}`);
  return data;
}

export async function listGardenPlants(id: string): Promise<Plant[]> {
  const { data } = await apiClient.get<Plant[]>(`/gardens/${id}/plants`);
  return data;
}

export async function addPlant(gardenId: string, payload: CreatePlantPayload): Promise<Plant> {
  const { data } = await apiClient.post<Plant>(`/gardens/${gardenId}/plants`, payload);
  return data;
}
