import { apiClient } from './client';
import { MyWallet } from '../types/api';

export async function getMyWallet(): Promise<MyWallet> {
  const { data } = await apiClient.get<MyWallet>('/wallet/mine');
  return data;
}

/** Admin: full transaction ledger for any partner/advisor's wallet. */
export async function getWalletForUser(userId: string): Promise<MyWallet> {
  const { data } = await apiClient.get<MyWallet>(`/wallet/admin/${userId}`);
  return data;
}

/** Admin/Super Admin: manually add balance to any user's wallet. */
export async function creditWallet(userId: string, amount: number, reason?: string): Promise<MyWallet> {
  const { data } = await apiClient.post<MyWallet>(`/wallet/admin/${userId}/credit`, { amount, reason });
  return data;
}

/** Admin/Super Admin: manually deduct balance from any user's wallet. */
export async function debitWallet(userId: string, amount: number, reason?: string): Promise<MyWallet> {
  const { data } = await apiClient.post<MyWallet>(`/wallet/admin/${userId}/debit`, { amount, reason });
  return data;
}
