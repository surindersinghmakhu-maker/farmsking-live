import { apiClient } from './client';
import { SprayProductCatalogItem, SprayScheduleItem, SprayScheduleStatus, SprayType } from '../types/api';

export interface CreateSprayScheduleItemPayload {
  cropCycleId: string;
  scheduledDate: string;
  sprayType?: SprayType;
  recommendedProduct: string;
  dosageInstructions?: string;
  alternativeOption?: string;
  alternativeOption2?: string;
  notes?: string;
}

export type UpdateSprayScheduleItemPayload = Partial<Omit<CreateSprayScheduleItemPayload, 'cropCycleId'>> & {
  status?: SprayScheduleStatus;
};

/** Advisor: schedule a new spray/treatment item for a crop they've accepted. */
export async function createSprayScheduleItem(payload: CreateSprayScheduleItemPayload): Promise<SprayScheduleItem> {
  const { data } = await apiClient.post<SprayScheduleItem>('/spray-schedules', payload);
  return data;
}

/** Farmer or assigned advisor: full spray schedule for a crop, oldest-first. */
export async function listSprayScheduleForCrop(cropCycleId: string): Promise<SprayScheduleItem[]> {
  const { data } = await apiClient.get<SprayScheduleItem[]>(`/spray-schedules/crop/${cropCycleId}`);
  return data;
}

/** Advisor: edit/complete/skip a spray schedule item. */
export async function updateSprayScheduleItem(id: string, payload: UpdateSprayScheduleItemPayload): Promise<SprayScheduleItem> {
  const { data } = await apiClient.patch<SprayScheduleItem>(`/spray-schedules/${id}`, payload);
  return data;
}

export async function deleteSprayScheduleItem(id: string): Promise<void> {
  await apiClient.delete(`/spray-schedules/${id}`);
}

/** Autocomplete search over the shared product-name catalog. */
export async function searchSprayProductCatalog(query: string): Promise<SprayProductCatalogItem[]> {
  const { data } = await apiClient.get<SprayProductCatalogItem[]>('/spray-schedules/catalog/search', { params: { q: query } });
  return data;
}
