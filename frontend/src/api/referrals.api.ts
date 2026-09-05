import { apiClient } from './client';

export interface ReferralUserItem {
  id: string;
  name: string;
  kingId: string;
  mobile?: string;
  createdAt: string;
}

export interface RoyaltyHistoryItem {
  id: string;
  amount: string;
  royaltyType: string;
  referenceCode?: string;
  createdAt: string;
  sourceUser: {
    id: string;
    name: string;
    kingId: string;
  };
}

export interface ReferralNetworkResponse {
  kingId: string;
  inviteUrl: string;
  directCount: number;
  extendedCount: number;
  totalNetworkCount: number;
  totalRoyaltiesEarned: number;
  directReferrals: { id: string; referredUser: ReferralUserItem; createdAt: string }[];
  extendedReferrals: { id: string; referredUser: ReferralUserItem; createdAt: string }[];
  royaltiesHistory: RoyaltyHistoryItem[];
}

export async function getMyReferralNetwork(): Promise<ReferralNetworkResponse> {
  const { data } = await apiClient.get<ReferralNetworkResponse>('/referrals/my-network');
  return data;
}

export async function linkReferralOnSignUp(referrerKingId: string) {
  const { data } = await apiClient.post('/referrals/link', { referrerKingId });
  return data;
}
