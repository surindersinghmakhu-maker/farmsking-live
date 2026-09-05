import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KingUser {
  id: string;
  name: string;
  kingId?: string | null;
  mobile: string;
  role?: string;
  village?: string;
}

export interface KingConnectLink {
  id: string;
  initiatorId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED';
  trustLevel: 'NONE' | 'BASIC' | 'TRUSTED' | 'AUTO_ACCEPT';
  initiatorAutoAccept: boolean;
  receiverAutoAccept: boolean;
  acceptedCount: number;
  initiator: KingUser;
  receiver: KingUser;
  createdAt: string;
  updatedAt: string;
}

export interface P2pSyncRequest {
  id: string;
  linkId: string;
  senderId: string;
  receiverId: string;
  transactionType: string;
  amount: string;
  reason: string;
  refBillNo?: string;
  notes?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'COUNTER_PROPOSED';
  rejectionReason?: string;
  counterAmount?: string;
  counterNote?: string;
  isVerified: boolean;
  expiresAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  sender?: KingUser;
  receiver?: KingUser;
  createdAt: string;
}

export interface DemandRequest {
  id: string;
  linkId: string;
  requesterId: string;
  farmerId: string;
  cropName: string;
  quantity: number;
  unit: string;
  offeredPrice?: string;
  requiredByDate?: string;
  notes?: string;
  status: 'PENDING' | 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED' | 'CONVERTED_TO_ORDER' | 'EXPIRED';
  acceptedQty?: number;
  counterNote?: string;
  rejectionReason?: string;
  requester?: KingUser;
  farmer?: KingUser;
  createdAt: string;
}

export interface KingPaymentRequest {
  id: string;
  linkId: string;
  senderId: string;
  receiverId: string;
  amount: string;
  acceptedAmount?: string;
  reason: string;
  refBillNo?: string;
  dueDate?: string;
  postponedDate?: string;
  status: 'PENDING' | 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'POSTPONED' | 'REJECTED' | 'EXPIRED';
  rejectionReason?: string;
  notes?: string;
  sender?: KingUser;
  receiver?: KingUser;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  eventType: 'SYNC_SENT' | 'SYNC_RECEIVED' | 'DEMAND_SENT' | 'DEMAND_RECEIVED' | 'PAYMENT_REQUEST_SENT' | 'PAYMENT_REQUEST_RECEIVED' | 'CONNECTION';
  direction: 'incoming' | 'outgoing' | 'both';
  status: string;
  amount?: string;
  reason?: string;
  cropName?: string;
  sender?: KingUser;
  receiver?: KingUser;
  initiator?: KingUser;
  createdAt: string;
}

// ─── Connection APIs ──────────────────────────────────────────────────────────

export async function sendConnectRequest(payload: { kingId?: string; mobile?: string }): Promise<KingConnectLink> {
  const { data } = await apiClient.post<KingConnectLink>('/king-connect/connect', payload);
  return data;
}

export async function listPendingConnections(): Promise<KingConnectLink[]> {
  const { data } = await apiClient.get<KingConnectLink[]>('/king-connect/connect/pending');
  return Array.isArray(data) ? data : [];
}

export async function respondToConnect(linkId: string, response: 'ACCEPTED' | 'DECLINED'): Promise<KingConnectLink> {
  const { data } = await apiClient.patch<KingConnectLink>(`/king-connect/connect/${linkId}/respond`, { response });
  return data;
}

export async function listMyConnections(): Promise<KingConnectLink[]> {
  const { data } = await apiClient.get<KingConnectLink[]>('/king-connect/connections');
  return Array.isArray(data) ? data : [];
}

export async function toggleAutoAccept(linkId: string): Promise<KingConnectLink> {
  const { data } = await apiClient.patch<KingConnectLink>(`/king-connect/connections/${linkId}/auto-accept`, {});
  return data;
}

// ─── P2P Sync APIs ────────────────────────────────────────────────────────────

export async function createSyncRequest(payload: {
  receiverKingId: string;
  transactionType: string;
  amount: number;
  reason: string;
  refBillNo?: string;
  notes?: string;
}): Promise<P2pSyncRequest> {
  const { data } = await apiClient.post<P2pSyncRequest>('/king-connect/sync', payload);
  return data;
}

export async function listPendingSync(): Promise<P2pSyncRequest[]> {
  const { data } = await apiClient.get<P2pSyncRequest[]>('/king-connect/sync/pending');
  return Array.isArray(data) ? data : [];
}

export async function listSyncHistory(): Promise<P2pSyncRequest[]> {
  const { data } = await apiClient.get<P2pSyncRequest[]>('/king-connect/sync/history');
  return Array.isArray(data) ? data : [];
}

export async function respondToSync(
  syncId: string,
  payload: { response: 'ACCEPTED' | 'REJECTED' | 'COUNTER_PROPOSED'; rejectionReason?: string; counterAmount?: number; counterNote?: string }
): Promise<P2pSyncRequest> {
  const { data } = await apiClient.patch<P2pSyncRequest>(`/king-connect/sync/${syncId}/respond`, payload);
  return data;
}

// ─── Demand Request APIs ──────────────────────────────────────────────────────

export async function createDemandRequest(payload: {
  farmerKingId: string;
  cropName: string;
  quantity: number;
  unit: string;
  offeredPrice?: number;
  requiredByDate?: string;
  notes?: string;
}): Promise<DemandRequest> {
  const { data } = await apiClient.post<DemandRequest>('/king-connect/demands', payload);
  return data;
}

export async function listDemands(type: 'incoming' | 'outgoing' = 'incoming'): Promise<DemandRequest[]> {
  const { data } = await apiClient.get<DemandRequest[]>(`/king-connect/demands?type=${type}`);
  return Array.isArray(data) ? data : [];
}

export async function respondToDemand(
  demandId: string,
  payload: { response: 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED'; acceptedQty?: number; counterNote?: string; rejectionReason?: string }
): Promise<DemandRequest> {
  const { data } = await apiClient.patch<DemandRequest>(`/king-connect/demands/${demandId}/respond`, payload);
  return data;
}

// ─── Payment Request APIs ─────────────────────────────────────────────────────

export async function createPaymentRequest(payload: {
  receiverKingId: string;
  amount: number;
  reason: string;
  refBillNo?: string;
  dueDate?: string;
  notes?: string;
}): Promise<KingPaymentRequest> {
  const { data } = await apiClient.post<KingPaymentRequest>('/king-connect/payment-requests', payload);
  return data;
}

export async function listPaymentRequests(type: 'incoming' | 'outgoing' = 'incoming'): Promise<KingPaymentRequest[]> {
  const { data } = await apiClient.get<KingPaymentRequest[]>(`/king-connect/payment-requests?type=${type}`);
  return Array.isArray(data) ? data : [];
}

export async function respondToPaymentRequest(
  requestId: string,
  payload: { response: 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'POSTPONED' | 'REJECTED'; acceptedAmount?: number; postponedDate?: string; rejectionReason?: string; notes?: string }
): Promise<KingPaymentRequest> {
  const { data } = await apiClient.patch<KingPaymentRequest>(`/king-connect/payment-requests/${requestId}/respond`, payload);
  return data;
}

// ─── Activity Feed & Shared Ledger ────────────────────────────────────────────

export async function getActivityFeed(): Promise<ActivityEvent[]> {
  const { data } = await apiClient.get<ActivityEvent[]>('/king-connect/activity');
  return Array.isArray(data) ? data : [];
}

export async function getSharedLedger(linkId: string): Promise<any> {
  const { data } = await apiClient.get(`/king-connect/shared-ledger/${linkId}`);
  return data;
}
