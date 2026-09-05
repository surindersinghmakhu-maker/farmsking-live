import { apiClient } from './client';
import type { FarmerPlanType } from './farmerPlans.api';

export type FarmerPlanPaymentStatus = 'PENDING' | 'SUBMITTED' | 'CONFIRMED' | 'REJECTED';

export interface FarmerPlanPaymentRequest {
  id: string;
  farmerId: string;
  targetPlan: FarmerPlanType;
  amount: string;
  daysGranted: number;
  status: FarmerPlanPaymentStatus;
  utr: string | null;
  requestedAt: string;
  submittedAt: string | null;
  confirmedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  farmer: { id: string; name: string; mobile: string; kingId: string | null };
}

export interface InitiateFarmerPlanPaymentResponse extends FarmerPlanPaymentRequest {
  upiLink: string;
}

export async function initiateFarmerPlanPayment(
  targetPlan: FarmerPlanType,
  billingPeriodDays?: number,
  farmerId?: string,
): Promise<InitiateFarmerPlanPaymentResponse> {
  const { data } = await apiClient.post<InitiateFarmerPlanPaymentResponse>(
    '/farmer-plan-payments',
    { targetPlan, billingPeriodDays },
    { params: farmerId ? { farmerId } : {} },
  );
  return data;
}

export async function listMineFarmerPlanPayments(): Promise<FarmerPlanPaymentRequest[]> {
  const { data } = await apiClient.get<FarmerPlanPaymentRequest[]>('/farmer-plan-payments/mine');
  return data;
}

export async function listPendingFarmerPlanPayments(): Promise<FarmerPlanPaymentRequest[]> {
  const { data } = await apiClient.get<FarmerPlanPaymentRequest[]>('/farmer-plan-payments/pending');
  return data;
}

export async function submitFarmerPlanPayment(id: string, utr?: string, screenshotUrl?: string): Promise<FarmerPlanPaymentRequest> {
  const { data } = await apiClient.post<FarmerPlanPaymentRequest>(`/farmer-plan-payments/${id}/submit`, { utr, screenshotUrl });
  return data;
}

export async function confirmFarmerPlanPayment(id: string): Promise<{ request: FarmerPlanPaymentRequest; newEndDate: string }> {
  const { data } = await apiClient.post(`/farmer-plan-payments/${id}/confirm`);
  return data;
}

export async function rejectFarmerPlanPayment(id: string, reason?: string): Promise<FarmerPlanPaymentRequest> {
  const { data } = await apiClient.post<FarmerPlanPaymentRequest>(`/farmer-plan-payments/${id}/reject`, { reason });
  return data;
}
