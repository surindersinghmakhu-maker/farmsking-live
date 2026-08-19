import { apiClient } from './client';
import { SprayItemTemplate, SprayType } from '../types/api';

export interface SprayItemTemplatePayload {
  item: string;
  sprayType?: SprayType;
  dose?: string;
  alternative1?: string;
  alternative2?: string;
}

/** Advisor: create a reusable item/dose/alternatives row for quick-filling spray schedule entries. */
export async function createSprayItemTemplate(payload: SprayItemTemplatePayload): Promise<SprayItemTemplate> {
  const { data } = await apiClient.post<SprayItemTemplate>('/spray-item-templates', payload);
  return data;
}

/** Advisor: their own item template library. */
export async function listMySprayItemTemplates(): Promise<SprayItemTemplate[]> {
  const { data } = await apiClient.get<SprayItemTemplate[]>('/spray-item-templates/mine');
  return data;
}

/** Super Admin: every advisor's item templates. */
export async function listAllSprayItemTemplates(): Promise<SprayItemTemplate[]> {
  const { data } = await apiClient.get<SprayItemTemplate[]>('/spray-item-templates');
  return data;
}

/** Farmer/Gardener: their assigned advisor's item library — used to resolve alternative1/alternative2
 * for products named in a spray schedule's recommendedProduct text. */
export async function listSprayItemTemplatesForMyAdvisor(): Promise<SprayItemTemplate[]> {
  const { data } = await apiClient.get<SprayItemTemplate[]>('/spray-item-templates/for-my-advisor');
  return data;
}

export async function updateSprayItemTemplate(id: string, payload: Partial<SprayItemTemplatePayload>): Promise<SprayItemTemplate> {
  const { data } = await apiClient.patch<SprayItemTemplate>(`/spray-item-templates/${id}`, payload);
  return data;
}

export async function deleteSprayItemTemplate(id: string): Promise<void> {
  await apiClient.delete(`/spray-item-templates/${id}`);
}
