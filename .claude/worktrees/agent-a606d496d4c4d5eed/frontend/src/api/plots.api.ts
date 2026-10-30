import { apiClient } from './client';
import { AreaUnit, Plot } from '../types/api';

export interface CreatePlotPayload {
  farmId: string;
  name: string;
  area: number;
  areaUnit?: AreaUnit;
  soilType?: string;
  irrigationType?: string;
  waterSource?: string;
  notes?: string;
}

export type UpdatePlotPayload = Partial<Omit<CreatePlotPayload, 'farmId'>>;

export async function listPlotsForFarm(farmId: string): Promise<Plot[]> {
  const { data } = await apiClient.get<Plot[]>(`/plots/farm/${farmId}`);
  return data;
}

export async function getPlot(id: string): Promise<Plot> {
  const { data } = await apiClient.get<Plot>(`/plots/${id}`);
  return data;
}

export async function createPlot(payload: CreatePlotPayload): Promise<Plot> {
  const { data } = await apiClient.post<Plot>('/plots', payload);
  return data;
}

export async function updatePlot(id: string, payload: UpdatePlotPayload): Promise<Plot> {
  const { data } = await apiClient.patch<Plot>(`/plots/${id}`, payload);
  return data;
}

export async function deletePlot(id: string): Promise<void> {
  await apiClient.delete(`/plots/${id}`);
}
