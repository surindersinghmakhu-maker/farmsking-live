import { apiClient } from './client';

export interface GroupVoiceCallResponse {
  call: {
    id: string;
    title: string;
    channelName: string;
    hostId: string;
    status: string;
    startedAt: string;
    host: {
      id: string;
      name: string;
      photoUrl?: string;
    };
    participants: Array<{
      id: string;
      userId: string;
      role: string;
      isMuted: boolean;
      isHandRaised: boolean;
      user: {
        id: string;
        name: string;
        photoUrl?: string;
        village?: string;
      };
    }>;
  };
  token: string;
  appId: string;
  channelName: string;
  eligibleFarmersCount?: number;
}

export async function startGroupCall(title: string): Promise<GroupVoiceCallResponse> {
  const { data } = await apiClient.post<GroupVoiceCallResponse>('/voice-call/start', { title });
  return data;
}

export async function joinGroupCall(callId: string): Promise<GroupVoiceCallResponse> {
  const { data } = await apiClient.post<GroupVoiceCallResponse>(`/voice-call/${callId}/join`);
  return data;
}

export async function endGroupCall(callId: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.post<{ success: boolean }>(`/voice-call/${callId}/end`);
  return data;
}

export async function getActiveCall(): Promise<GroupVoiceCallResponse['call'] | null> {
  const { data } = await apiClient.get<GroupVoiceCallResponse['call'] | null>('/voice-call/active');
  return data;
}
