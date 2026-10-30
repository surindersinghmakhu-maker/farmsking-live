import { apiClient } from './client';
import {
  AdminUser,
  AdvisorType,
  FarmerProfileStatus,
  ListUsersResponse,
  Role,
  SoilType,
  SprayTankSizeL,
  WaterType,
} from '../types/api';

export interface ListUsersParams {
  role?: Role;
  status?: 'active' | 'inactive' | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateAdvisorPayload {
  mobile: string;
  name: string;
  email?: string;
  village?: string;
  district?: string;
  state?: string;
  advisorType: AdvisorType;
}

export interface CreateAdvisorResponse {
  user: AdminUser;
  tempPassword: string;
}

export interface CreateStaffPayload {
  mobile: string;
  name: string;
  email?: string;
  village?: string;
  district?: string;
  state?: string;
}

export async function listUsers(params: ListUsersParams = {}): Promise<ListUsersResponse> {
  const { data } = await apiClient.get<ListUsersResponse>('/users', { params });
  return data;
}

export async function createAdvisor(payload: CreateAdvisorPayload): Promise<CreateAdvisorResponse> {
  const { data } = await apiClient.post<CreateAdvisorResponse>('/users/advisors', payload);
  return data;
}

export async function createOperator(payload: CreateStaffPayload): Promise<CreateAdvisorResponse> {
  const { data } = await apiClient.post<CreateAdvisorResponse>('/users/operators', payload);
  return data;
}

export async function createAdmin(payload: CreateStaffPayload): Promise<CreateAdvisorResponse> {
  const { data } = await apiClient.post<CreateAdvisorResponse>('/users/admins', payload);
  return data;
}

export async function promoteToBusinessPartner(id: string): Promise<AdminUser> {
  const { data } = await apiClient.patch<AdminUser>(`/users/${id}/role`, { role: 'BUSINESS_PARTNER' });
  return data;
}

export async function deactivateUser(id: string): Promise<AdminUser> {
  const { data } = await apiClient.patch<AdminUser>(`/users/${id}/deactivate`);
  return data;
}

export async function reactivateUser(id: string): Promise<AdminUser> {
  const { data } = await apiClient.patch<AdminUser>(`/users/${id}/reactivate`);
  return data;
}

export interface UpdateFarmerProfilePayload {
  photoUrl?: string;
  sprayTankSizeL?: SprayTankSizeL;
  soilType?: SoilType;
  waterType?: WaterType;
}

export async function getMyProfileStatus(): Promise<FarmerProfileStatus> {
  const { data } = await apiClient.get<FarmerProfileStatus>('/users/me/profile-status');
  return data;
}

export async function updateMyFarmerProfile(payload: UpdateFarmerProfilePayload) {
  const { data } = await apiClient.patch('/users/me/profile', payload);
  return data;
}

export interface UpdateAdvisorProfilePayload {
  photoUrl?: string;
  specialization?: string;
  bio?: string;
  yearsExperience?: number;
  email?: string;
  village?: string;
  district?: string;
  state?: string;
  advisorType?: AdvisorType;
}

export async function updateMyAdvisorProfile(payload: UpdateAdvisorProfilePayload) {
  const { data } = await apiClient.patch<AdminUser>('/users/me/advisor-profile', payload);
  return data;
}
