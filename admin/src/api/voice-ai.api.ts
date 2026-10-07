import { apiClient } from './client';

export interface ProcessVoiceResponse {
  id: string;
  transcribedText: string;
  parsedIntent: string;
  spokenResponse: string;
  status: string;
}

export async function processVoiceCommand(transcript: string): Promise<ProcessVoiceResponse> {
  const { data } = await apiClient.post<ProcessVoiceResponse>('/ai/voice/command', { transcript });
  return data;
}

export async function getVoiceHistory() {
  const { data } = await apiClient.get('/ai/voice/history');
  return data;
}
