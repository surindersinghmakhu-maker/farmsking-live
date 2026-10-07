import { apiClient } from './client';
import { AdvisorSubscription } from '../types/api';

export async function getMySubscription(): Promise<AdvisorSubscription | null> {
  const { data } = await apiClient.get<AdvisorSubscription | null>('/subscriptions/mine');
  return data;
}
