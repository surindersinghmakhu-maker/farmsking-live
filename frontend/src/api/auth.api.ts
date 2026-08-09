import { apiClient } from './client';
import { AuthResponse } from '../types/api';

export interface RegisterPayload {
  mobile: string;
  password: string;
  name: string;
  village?: string;
  district?: string;
  state?: string;
  preferredLanguage?: string;
}

export interface LoginPayload {
  mobile: string;
  password: string;
}

export async function registerFarmer(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
}
