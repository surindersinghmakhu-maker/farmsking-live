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
/** Advisor nudges a formerly-assigned (now inactive) farmer to renew their membership. */
export async function sendRenewalReminder(farmerId: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.post<{ success: boolean }>(`/advisor-assignments/farmers/${farmerId}/renewal-reminder`);
  return data;
}

export async function listAvailableAdvisors(): Promise<AvailableAdvisor[]> {
  const { data } = await apiClient.get<AvailableAdvisor[]>('/advisor-assignments/available');
  return data;
}

/** Farmer: browse matching specialist advisors for a specific crop with category filter and quota status. */
export async function listAvailableAdvisorsForCrop(cropCycleId: string): Promise<AvailableAdvisor[]> {
  const { data } = await apiClient.get<AvailableAdvisor[]>(`/advisor-assignments/available-for-crop/${cropCycleId}`);
  return data;
}

export async function chooseAdvisor(advisorId: string, cropId?: string): Promise<AdvisorAssignment> {
  const { data } = await apiClient.post<AdvisorAssignment>(`/advisor-assignments/choose-advisor/${advisorId}`, { cropId });
  return data;
}

export async function cancelMyPendingRequest(): Promise<AdvisorAssignment> {
  try {
    const { data } = await apiClient.post<AdvisorAssignment>('/advisor-assignments/cancel-pending', {});
    return data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      const pending = await getMyPendingRequest();
      if (pending?.id) {
        const { data } = await apiClient.post<AdvisorAssignment>(`/advisor-assignments/${pending.id}/revoke`, {});
        return data;
      }
    }
    throw err;
  }
}

export async function getPendingDoctorChanges(): Promise<AdvisorAssignment[]> {
  const { data } = await apiClient.get<AdvisorAssignment[]>('/advisor-assignments/pending-doctor-changes');
  return data;
}

export async function adminApproveDoctorChange(id: string): Promise<AdvisorAssignment> {
  const { data } = await apiClient.post<AdvisorAssignment>(`/advisor-assignments/${id}/admin-approve-change`, {});
  return data;
}

export async function adminRejectDoctorChange(id: string, reason?: string): Promise<AdvisorAssignment> {
  const { data } = await apiClient.post<AdvisorAssignment>(`/advisor-assignments/${id}/admin-reject-change`, { reason });
  return data;
}

export async function getMyAdvisorPlans(): Promise<any[]> {
  const { data } = await apiClient.get<any[]>('/advisor-assignments/plans/my-plans');
  return data;
}

export async function saveAdvisorPlan(dto: {
  planType: 'VIP_MONTHLY' | 'PER_CROP' | 'CONSULTATION';
  price: number;
  callRequestLimit?: number;
  inAppCallLimit?: number;
  videoCallAllowed?: boolean;
  videoCallLimit?: number;
  chatEnabled?: boolean;
}): Promise<any> {
  const { data } = await apiClient.post<any>('/advisor-assignments/plans', dto);
  return data;
}

export async function getDoctorApprovedPlans(advisorId: string): Promise<any[]> {
  const { data } = await apiClient.get<any[]>(`/advisor-assignments/plans/doctor/${advisorId}`);
  return data;
}

export async function scheduleGroupCall(dto: {
  title: string;
  scheduledAt: string;
  targetAudienceType?: string;
  targetPlanType?: string;
  targetCropName?: string;
  invitedFarmerIds?: string[];
  alertMessage?: string;
}): Promise<any> {
  const { data } = await apiClient.post<any>('/voice-call/schedule', dto);
  return data;
}

export async function sendGroupCallAlert(callId: string, message?: string): Promise<any> {
  const { data } = await apiClient.post<any>(`/voice-call/${callId}/send-alert`, { message });
  return data;
}

export async function getAdvisorGroupEvents(): Promise<any[]> {
  const { data } = await apiClient.get<any[]>('/voice-call/advisor/events');
  return data;
}

export async function getFarmerGroupInvitations(): Promise<any[]> {
  const { data } = await apiClient.get<any[]>('/voice-call/farmer/invitations');
  return data;
}



