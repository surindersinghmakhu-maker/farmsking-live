import { apiClient } from './client';
import { AdvisorAssignment, FarmerDetail, FarmerStats } from '../types/api';

export async function getFarmerStats(): Promise<FarmerStats> {
  const { data } = await apiClient.get<FarmerStats>('/advisor-assignments/stats');
  return data;
}

export async function listFarmers(status: 'ACTIVE' | 'INACTIVE' | 'ALL'): Promise<AdvisorAssignment[]> {
  const { data } = await apiClient.get<AdvisorAssignment[]>('/advisor-assignments/farmers', { params: { status } });
  return data;
}

export async function getFarmerDetail(farmerId: string): Promise<FarmerDetail> {
  const { data } = await apiClient.get<FarmerDetail>(`/advisor-assignments/farmers/${farmerId}`);
  return data;
}

export async function getMyAdvisor(): Promise<AdvisorAssignment | null> {
  const { data } = await apiClient.get<AdvisorAssignment | null>('/advisor-assignments/my-advisor');
  return data;
}
