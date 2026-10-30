import { apiClient } from './client';

export type PlanPaymentStatus = 'PENDING' | 'SUBMITTED' | 'CONFIRMED' | 'REJECTED';

export interface PlanPaymentRequest {
  id: string;
  farmerId: string;
  subscriptionId: string;
  amount: string;
  daysGranted: number;
  status: PlanPaymentStatus;
  utr: string | null;
  requestedAt: string;
  submittedAt: string | null;
  confirmedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  farmer: { id: string; name: string; mobile: string; kingId: string | null };
  subscription: { plan: { name: string; price: string } };
}

export interface InitiatePlanPaymentResponse extends PlanPaymentRequest {
  upiLink: string;
}

export async function initiatePlanPayment(farmerId?: string): Promise<InitiatePlanPaymentResponse> {
  const { data } = await apiClient.post<InitiatePlanPaymentResponse>('/plan-payments', null, {
    params: farmerId ? { farmerId } : {},
  });
  return data;
}

export async function listMinePlanPayments(): Promise<PlanPaymentRequest[]> {
  const { data } = await apiClient.get<PlanPaymentRequest[]>('/plan-payments/mine');
  return data;
}

export async function listPendingPlanPayments(): Promise<PlanPaymentRequest[]> {
  const { data } = await apiClient.get<PlanPaymentRequest[]>('/plan-payments/pending');
  return data;
}

export async function submitPlanPayment(id: string, utr?: string): Promise<PlanPaymentRequest> {
  const { data } = await apiClient.post<PlanPaymentRequest>(`/plan-payments/${id}/submit`, { utr });
  return data;
}

export async function confirmPlanPayment(id: string): Promise<{ request: PlanPaymentRequest; newEndDate: string }> {
  const { data } = await apiClient.post(`/plan-payments/${id}/confirm`);
  return data;
}

export async function rejectPlanPayment(id: string, reason?: string): Promise<PlanPaymentRequest> {
  const { data } = await apiClient.post<PlanPaymentRequest>(`/plan-payments/${id}/reject`, { reason });
  return data;
}
