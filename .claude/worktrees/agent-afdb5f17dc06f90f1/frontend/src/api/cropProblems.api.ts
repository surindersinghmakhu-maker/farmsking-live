import { apiClient } from './client';
import { CropProblem, CropProblemSeverity, CropProblemStatus } from '../types/api';

export interface CreateCropProblemPayload {
  cropCycleId: string;
  title: string;
  description: string;
  severity?: CropProblemSeverity;
  photoUrls?: string[];
}

export interface RespondCropProblemPayload {
  advisorResponse?: string;
  recommendedProduct?: string;
  followUpDate?: string;
  status?: CropProblemStatus;
}

export async function createCropProblem(payload: CreateCropProblemPayload): Promise<CropProblem> {
  const { data } = await apiClient.post<CropProblem>('/crop-problems', payload);
  return data;
}

export async function getMyCropProblems(): Promise<CropProblem[]> {
  const { data } = await apiClient.get<CropProblem[]>('/crop-problems/mine');
  return data;
}

export async function getAssignedCropProblems(): Promise<CropProblem[]> {
  const { data } = await apiClient.get<CropProblem[]>('/crop-problems/assigned');
  return data;
}

export async function getCropProblem(id: string): Promise<CropProblem> {
  const { data } = await apiClient.get<CropProblem>(`/crop-problems/${id}`);
  return data;
}

export async function respondToCropProblem(id: string, payload: RespondCropProblemPayload): Promise<CropProblem> {
  const { data } = await apiClient.patch<CropProblem>(`/crop-problems/${id}/respond`, payload);
  return data;
}

export async function updateCropProblemStatus(id: string, status: CropProblemStatus): Promise<CropProblem> {
  const { data } = await apiClient.patch<CropProblem>(`/crop-problems/${id}/status`, { status });
  return data;
}
