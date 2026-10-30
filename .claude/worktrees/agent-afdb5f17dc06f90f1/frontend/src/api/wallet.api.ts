import { apiClient } from './client';
import { MyWallet } from '../types/api';

export async function getMyWallet(): Promise<MyWallet> {
  const { data } = await apiClient.get<MyWallet>('/wallet/mine');
  return data;
}
