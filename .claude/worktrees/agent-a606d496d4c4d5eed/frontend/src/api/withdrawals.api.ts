import { apiClient } from './client';
import { WithdrawalRequest } from '../types/api';

export async function createWithdrawal(requestedAmount: number): Promise<WithdrawalRequest> {
  const { data } = await apiClient.post<WithdrawalRequest>('/withdrawals', { requestedAmount });
  return data;
}

export async function listMyWithdrawals(): Promise<WithdrawalRequest[]> {
  const { data } = await apiClient.get<WithdrawalRequest[]>('/withdrawals/mine');
  return data;
}

export async function listAllWithdrawals(): Promise<WithdrawalRequest[]> {
  const { data } = await apiClient.get<WithdrawalRequest[]>('/withdrawals');
  return data;
}

export async function approveWithdrawal(id: string, approvedAmount?: number, notes?: string): Promise<WithdrawalRequest> {
  const { data } = await apiClient.patch<WithdrawalRequest>(`/withdrawals/${id}/approve`, { approvedAmount, notes });
  return data;
}

export async function rejectWithdrawal(id: string, notes?: string): Promise<WithdrawalRequest> {
  const { data } = await apiClient.patch<WithdrawalRequest>(`/withdrawals/${id}/reject`, { notes });
  return data;
}
