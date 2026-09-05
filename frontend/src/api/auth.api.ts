import { apiClient } from './client';
import { AuthResponse, SoilType, SprayTankSizeL, WaterType } from '../types/api';

export interface RegisterPayload {
  mobile: string;
  password: string;
  name: string;
  pincode: string;
  accountType?: 'CUSTOMER' | 'FARMER' | 'GARDENER';
  sprayTankSizeL?: SprayTankSizeL;
  soilType?: SoilType;
  waterType?: WaterType;
  postOffice?: string;
  village?: string;
  district?: string;
  state?: string;
  preferredLanguage?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  referralCode?: string;
  upiId?: string;
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

export async function forgotPasswordStart(payload: { mobile: string; pincode: string }): Promise<{ success: boolean; message: string; devOtp?: string }> {
  const { data } = await apiClient.post('/auth/forgot-password/start', payload);
  return data;
}

export async function forgotPasswordVerify(payload: { mobile: string; otp: string }): Promise<{ success: boolean; verified: boolean; message: string }> {
  const { data } = await apiClient.post('/auth/forgot-password/verify', payload);
  return data;
}

export async function forgotPasswordReset(payload: { mobile: string; otp: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
  const { data } = await apiClient.post('/auth/forgot-password/reset', payload);
  return data;
}
