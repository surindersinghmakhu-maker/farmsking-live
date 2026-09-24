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

export interface RefereeStatementItem {
  refereeId: string;
  refereeName: string;
  refereeKingId: string;
  registrationDate: string;
  issuedAmount: number;
  signupBonusIssued: number;
  planBonusIssued: number;
  pendingAmount: number;
  status: 'PENDING' | 'SUCCESS';
  referenceCodeUsed: string;
}

export interface MyReferralInfo {
  referredByName: string;
  referredByKingId: string;
  referenceCode: string;
  welcomeBonusIssued: number;
  planBonusPending: number;
  status: 'PENDING' | 'SUCCESS';
}

export interface ReferralStatementResponse {
  summary: {
    totalReferees: number;
    totalIssuedBonus: number;
    totalPendingBonus: number;
    signupBonusAmount: number;
    welcomeBonusAmount: number;
    planUpgradeBonusAmount: number;
  };
  myReferralInfo: MyReferralInfo | null;
  referees: RefereeStatementItem[];
}

export async function getReferralStatement(): Promise<ReferralStatementResponse> {
  const { data } = await apiClient.get<ReferralStatementResponse>('/wallet/referral-statement');
  return data;
}

export interface AdminBonusItem {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
  category: 'WELCOME' | 'REFERRAL_SIGNUP' | 'REFERRAL_PLAN' | 'OTHER';
  user: { id: string; name?: string; mobile: string; kingId?: string; role: string };
  relatedUser?: { id: string; name?: string; mobile: string; kingId?: string; role: string } | null;
}

export interface AdminBonusReportResponse {
  summary: {
    totalBonusIssued: number;
    totalWelcome: number;
    countWelcome: number;
    totalReferralSignup: number;
    countReferralSignup: number;
    totalReferralPlan: number;
    countReferralPlan: number;
    totalOtherBonus: number;
    countOtherBonus: number;
    totalWalletLiability: number;
    totalBonusTransactions: number;
  };
  transactions: AdminBonusItem[];
}

export async function getAdminBonusReport(): Promise<AdminBonusReportResponse> {
  const { data } = await apiClient.get<AdminBonusReportResponse>('/wallet/admin/bonus-report');
  return data;
}

