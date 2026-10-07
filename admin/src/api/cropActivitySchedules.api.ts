import { apiClient } from './client';
import { ActivityType, CropActivitySchedule } from '../types/api';

export interface CreateActivityScheduleItemPayload {
  activityType: ActivityType;
  title: string;
  description?: string;
  scheduledDate: string;
  notes?: string;
}

export interface BulkCreateActivitySchedulePayload {
  cropCycleId: string;
  items: CreateActivityScheduleItemPayload[];
}

export type UpdateActivitySchedulePayload = Partial<CreateActivityScheduleItemPayload>;

export async function getSchedulesForCropCycle(cropCycleId: string): Promise<CropActivitySchedule[]> {
  const { data } = await apiClient.get<CropActivitySchedule[]>(`/crop-activity-schedules/crop/${cropCycleId}`);
  return data;
}

export async function bulkCreateSchedules(payload: BulkCreateActivitySchedulePayload): Promise<CropActivitySchedule[]> {
  const { data } = await apiClient.post<CropActivitySchedule[]>('/crop-activity-schedules/bulk', payload);
  return data;
}

export async function updateSchedule(id: string, payload: UpdateActivitySchedulePayload): Promise<CropActivitySchedule> {
  const { data } = await apiClient.patch<CropActivitySchedule>(`/crop-activity-schedules/${id}`, payload);
  return data;
}

export async function deleteSchedule(id: string): Promise<void> {
  await apiClient.delete(`/crop-activity-schedules/${id}`);
}

export async function completeSchedule(id: string, notes?: string): Promise<CropActivitySchedule> {
  const { data } = await apiClient.patch<CropActivitySchedule>(`/crop-activity-schedules/${id}/complete`, { notes });
  return data;
}

/** Advisor nudges the farmer about this task — sends a notification (shown as an alert next app open) and a chat message. */
export async function remindSchedule(id: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.post<{ success: boolean }>(`/crop-activity-schedules/${id}/remind`);
  return data;
}

export async function getMyTodaySchedule(): Promise<CropActivitySchedule[]> {
  const { data } = await apiClient.get<CropActivitySchedule[]>('/crop-activity-schedules/today');
  return data;
}

export async function getAdvisorTodaySchedule(): Promise<CropActivitySchedule[]> {
  const { data } = await apiClient.get<CropActivitySchedule[]>('/crop-activity-schedules/advisor/today');
  return data;
}

export async function getAdvisorUpcomingSchedule(): Promise<CropActivitySchedule[]> {
  const { data } = await apiClient.get<CropActivitySchedule[]>('/crop-activity-schedules/advisor/upcoming');
  return data;
}

export async function getAdvisorDelayedSchedule(): Promise<CropActivitySchedule[]> {
  const { data } = await apiClient.get<CropActivitySchedule[]>('/crop-activity-schedules/advisor/delayed');
  return data;
}
