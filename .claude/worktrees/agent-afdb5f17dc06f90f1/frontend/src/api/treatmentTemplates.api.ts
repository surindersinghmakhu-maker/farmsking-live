import { apiClient } from './client';
import { CropActivitySchedule, TreatmentTemplate } from '../types/api';

export interface TreatmentTemplateTaskInput {
  dayNumber: number;
  treatmentName: string;
}

export interface CreateTreatmentTemplatePayload {
  problemTitle: string;
  cropCategory?: string;
  tasks: TreatmentTemplateTaskInput[];
}

export type UpdateTreatmentTemplatePayload = Partial<CreateTreatmentTemplatePayload> & { isActive?: boolean };

export async function createTreatmentTemplate(payload: CreateTreatmentTemplatePayload): Promise<TreatmentTemplate> {
  const { data } = await apiClient.post<TreatmentTemplate>('/treatment-templates', payload);
  return data;
}

export async function listTreatmentTemplates(): Promise<TreatmentTemplate[]> {
  const { data } = await apiClient.get<TreatmentTemplate[]>('/treatment-templates');
  return data;
}

export async function updateTreatmentTemplate(id: string, payload: UpdateTreatmentTemplatePayload): Promise<TreatmentTemplate> {
  const { data } = await apiClient.patch<TreatmentTemplate>(`/treatment-templates/${id}`, payload);
  return data;
}

export async function removeTreatmentTemplate(id: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete<{ success: boolean }>(`/treatment-templates/${id}`);
  return data;
}

export async function assignTreatmentTemplate(id: string, cropCycleId: string): Promise<CropActivitySchedule[]> {
  const { data } = await apiClient.post<CropActivitySchedule[]>(`/treatment-templates/${id}/assign`, { cropCycleId });
  return data;
}
