import { apiClient } from './client';

export type CallRequestStatus = 'PENDING' | 'RESOLVED';

export interface CallRequest {
  id: string;
  farmerId: string;
  advisorId: string;
  status: CallRequestStatus;
  resolvedComment: string | null;
  resolvedAt: string | null;
  createdAt: string;
  farmer?: { id: string; name: string; mobile: string; kingId: string | null; photoUrl: string | null };
  advisor?: { id: string; name: string; mobile: string };
}

export async function createCallRequest(): Promise<CallRequest> {
  const { data } = await apiClient.post<CallRequest>('/call-requests');
  return data;
}

export async function listMyCallRequests(): Promise<CallRequest[]> {
  const { data } = await apiClient.get<CallRequest[]>('/call-requests/mine');
  return data;
}

export async function getMyPendingCallRequest(): Promise<CallRequest | null> {
  const { data } = await apiClient.get<CallRequest | null>('/call-requests/mine/pending');
  return data;
}

export async function resolveCallRequest(id: string, comment: string): Promise<CallRequest> {
  const { data } = await apiClient.patch<CallRequest>(`/call-requests/${id}/resolve`, { comment });
  return data;
}
