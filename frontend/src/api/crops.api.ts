import { apiClient } from './client';
import { AdvisorReviewCropCycle, CropCategory, CropCycle, CropStatus, MyCropCycle } from '../types/api';

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
  stage?: 'PLANTATION' | 'VEGETATIVE' | 'FLOWERING' | 'HARVESTING' | 'COMPLETED';
  unit?: string;
  pricePerUnit?: number;
  harvestType?: 'ONE_TIME' | 'CONTINUOUS';
  notes?: string;
}

export type UpdateCropPayload = Partial<Omit<CreateCropPayload, 'plotId'>>;

export async function listCropsForPlot(plotId: string): Promise<CropCycle[]> {
  const { data } = await apiClient.get<CropCycle[]>(`/crops/plot/${plotId}`);
  return data;
}

/** Farmer: every active crop cycle across all their own farms/plots (real data, not per-plot). */
export async function listMyCrops(): Promise<MyCropCycle[]> {
  const { data } = await apiClient.get<MyCropCycle[]>('/crops/mine');
  return data;
}

export async function getCrop(id: string): Promise<CropCycle> {
  const { data } = await apiClient.get<CropCycle>(`/crops/${id}`);
  return data;
}

export interface CropLookupResult extends CropCycle {
  cropId?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  plot: {
    id: string;
    name: string;
    areaUnit?: string | null;
    irrigationType?: string | null;
    farm: {
      id: string;
      name: string;
      owner: { id: string; name: string; kingId: string | null; mobile: string };
    };
  };
}

/** Admin/Super Admin: resolve a crop's short public Crop ID (e.g. "CR-482910") to its full record, for support/edit lookups. */
export async function lookupCropByCropId(cropId: string): Promise<CropLookupResult> {
  const { data } = await apiClient.get<CropLookupResult>(`/crops/lookup/${encodeURIComponent(cropId)}`);
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

/** Farmer: send a crop to their assigned advisor for review. */
export async function submitCropToAdvisor(id: string): Promise<CropCycle> {
  const { data } = await apiClient.post<CropCycle>(`/crops/${id}/submit-to-advisor`);
  return data;
}

/** Farmer: cancel their own still-pending crop submission before the advisor responds. */
export async function cancelCropSubmission(id: string): Promise<CropCycle> {
  const { data } = await apiClient.post<CropCycle>(`/crops/${id}/cancel-submission`);
  return data;
}

/** Advisor: crops submitted by their assigned farmers, awaiting review. */
export async function listPendingCropsForAdvisor(): Promise<AdvisorReviewCropCycle[]> {
  const { data } = await apiClient.get<AdvisorReviewCropCycle[]>('/crops/advisor/pending');
  return data;
}

/** Advisor: crops they've already accepted. */
export async function listAcceptedCropsForAdvisor(): Promise<AdvisorReviewCropCycle[]> {
  const { data } = await apiClient.get<AdvisorReviewCropCycle[]>('/crops/advisor/accepted');
  return data;
}

/** Advisor: accept a farmer's submitted crop. */
export async function acceptCropByAdvisor(id: string): Promise<CropCycle> {
  const { data } = await apiClient.post<CropCycle>(`/crops/${id}/accept`);
  return data;
}

/** Advisor: reject a farmer's submitted crop — reverts it so the farmer can fix it up and resubmit. */
export async function rejectCropByAdvisor(id: string, reason?: string): Promise<CropCycle> {
  const { data } = await apiClient.post<CropCycle>(`/crops/${id}/reject`, { reason });
  return data;
}

/** Advisor: set/update the day-wise advisory schedule text for a crop they've accepted. */
export async function updateCropSchedule(id: string, assignedSchedule: string): Promise<CropCycle> {
  const { data } = await apiClient.patch<CropCycle>(`/crops/${id}/schedule`, { assignedSchedule });
  return data;
}
