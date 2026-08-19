import { apiClient } from './client';
import { AdvisorAssignment, AvailableAdvisor, FarmerDetail, FarmerStats } from '../types/api';

export async function getFarmerStats(): Promise<FarmerStats> {
  const { data } = await apiClient.get<FarmerStats>('/advisor-assignments/stats');
  return data;
}

export async function listFarmers(status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'ALL'): Promise<AdvisorAssignment[]> {
  const { data } = await apiClient.get<AdvisorAssignment[]>('/advisor-assignments/farmers', { params: { status } });
  return data;
}

/** Advisor accepts a farmer's PENDING hire request. */
export async function acceptAssignment(id: string): Promise<AdvisorAssignment> {
  const { data } = await apiClient.post<AdvisorAssignment>(`/advisor-assignments/${id}/accept`, {});
  return data;
}

/** Advisor rejects a farmer's PENDING hire request. */
export async function rejectAssignment(id: string, reason?: string): Promise<AdvisorAssignment> {
  const { data } = await apiClient.post<AdvisorAssignment>(`/advisor-assignments/${id}/reject`, { reason });
  return data;
}

/** Farmer/Gardener: their most recent still-open hire request, awaiting the advisor's accept/reject. */
export async function getMyPendingRequest(): Promise<AdvisorAssignment | null> {
  const { data } = await apiClient.get<AdvisorAssignment | null>('/advisor-assignments/my-pending-request');
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

/** Farmer/Gardener: browse advisors of the matching type they could choose. */
/** Advisor nudges a formerly-assigned (now inactive) farmer to renew their plan. */
export async function sendRenewalReminder(farmerId: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.post<{ success: boolean }>(`/advisor-assignments/farmers/${farmerId}/renewal-reminder`);
  return data;
}

export async function listAvailableAdvisors(): Promise<AvailableAdvisor[]> {
  const { data } = await apiClient.get<AvailableAdvisor[]>('/advisor-assignments/available');
  return data;
}
