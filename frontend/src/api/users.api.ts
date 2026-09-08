import { apiClient } from './client';
import {
  AdminUser,
  AdvisorType,
  FarmerProfileStatus,
  ListUsersResponse,
  OperatorPermission,
  Role,
  SoilType,
  SprayTankSizeL,
  User,
  WaterType,
} from '../types/api';

/** Refetches the caller's own current record — used to pick up freshly-granted roles without re-login. */
export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/users/me');
  return data;
}

export interface MyReferral {
  id: string;
  name: string;
  kingId: string | null;
  mobile: string;
  createdAt: string;
  commissionEarned: number;
}

export async function getMyReferrals(): Promise<MyReferral[]> {
  const { data } = await apiClient.get<MyReferral[]>('/users/me/referrals');
  return data;
}

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

export interface UserDetail {
  user: AdminUser;
  farmCount: number;
  walletBalance: number;
  couponsUsed: { id: string; code: string; plan: string; daysGranted: number; usedAt: string | null }[];
  orderCount: number;
}

export async function getUserDetail(id: string): Promise<UserDetail> {
  const { data } = await apiClient.get<UserDetail>(`/users/${id}/detail`);
  return data;
}

/** Full-profile edit — every shared field plus role-specific ones, so one form edits any user regardless of role. */
export interface AdminUpdateUserPayload {
  name?: string;
  mobile?: string;
  email?: string;
  photoUrl?: string;
  pincode?: string;
  postOffice?: string;
  village?: string;
  district?: string;
  state?: string;
  notificationsEnabled?: boolean;
  specialization?: string;
  bio?: string;
  yearsExperience?: number;
  advisorType?: 'FARM' | 'GARDEN';
  qualification?: string;
  profileTitle?: string;
  sprayTankSizeL?: 15 | 20 | 25;
  soilType?: string;
  waterType?: string;
  alternativeMobile?: string;
  panNumber?: string;
  upiId?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankAccountHolderName?: string;
}

export async function adminUpdateUser(id: string, payload: AdminUpdateUserPayload): Promise<AdminUser> {
  const { data } = await apiClient.patch<AdminUser>(`/users/${id}/admin-edit`, payload);
  return data;
}

/** Sets a new password directly — the old one is a one-way hash and can never be shown. Omit newPassword to auto-generate one. */
export async function resetUserPassword(id: string, newPassword?: string): Promise<{ tempPassword: string }> {
  const { data } = await apiClient.patch<{ tempPassword: string }>(`/users/${id}/reset-password`, { newPassword });
  return data;
}

/** The checkbox-toggleable roles — staff roles (Admin/Super Admin/Operator) have their own dedicated flows. */
export const ASSIGNABLE_CHECKBOX_ROLES: Role[] = ['CUSTOMER', 'FARMER', 'GARDENER', 'ADVISOR', 'BUSINESS_PARTNER'];

export async function updateActiveRoles(id: string, activeRoles: Role[]): Promise<AdminUser> {
  const { data } = await apiClient.patch<AdminUser>(`/users/${id}/active-roles`, { activeRoles });
  return data;
}

export interface UpdateFarmerProfilePayload {
  photoUrl?: string;
  sprayTankSizeL?: SprayTankSizeL;
  soilType?: SoilType;
  waterType?: WaterType;
  pincode?: string;
  postOffice?: string;
  village?: string;
  district?: string;
  state?: string;
  upiId?: string;
  billPrintingAddress?: string;
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
  pincode?: string;
  postOffice?: string;
  specialization?: string;
  bio?: string;
  yearsExperience?: number;
  email?: string;
  village?: string;
  district?: string;
  state?: string;
  advisorType?: AdvisorType;
  notificationsEnabled?: boolean;
}

export async function updateMyAdvisorProfile(payload: UpdateAdvisorProfilePayload) {
  const { data } = await apiClient.patch<AdminUser>('/users/me/advisor-profile', payload);
  return data;
}

/** Shared self-service profile fields, same shape for every role — one profile per mobile number. */
export interface UpdateMyAddressPayload {
  name?: string;
  email?: string;
  photoUrl?: string;
  pincode?: string;
  postOffice?: string;
  village?: string;
  district?: string;
  state?: string;
  billPrintingAddress?: string;
  notificationsEnabled?: boolean;
  whatsappGroupEnabled?: boolean;
  /** Null clears the threshold (alert off); a number sets and enables it. */
  weatherAlertMinTempC?: number | null;
  weatherAlertMaxTempC?: number | null;
  weatherAlertRainEnabled?: boolean;
}

export async function updateMyAddress(payload: UpdateMyAddressPayload) {
  const { data } = await apiClient.patch('/users/me/address', payload);
  return data;
}

/** Self-service: a Customer-only account grants itself the FARMER role too — both dashboards become available. */
export async function becomeFarmer(payload?: UpdateFarmerProfilePayload) {
  const { data } = await apiClient.post('/users/me/become-farmer', payload ?? {});
  return data;
}

/** Self-service: a Customer-only account grants itself the GARDENER role too — both dashboards become available. */
export async function becomeGardener() {
  const { data } = await apiClient.post('/users/me/become-gardener', {});
  return data;
}

/** Admin/Super Admin: grant an Operator account read-only access to specific fixed areas. */
export async function updateOperatorPermissions(id: string, permissions: OperatorPermission[]): Promise<AdminUser> {
  const { data } = await apiClient.patch<AdminUser>(`/users/${id}/operator-permissions`, { permissions });
  return data;
}

export interface KingIdLookupResult {
  id: string;
  name: string;
  kingId: string | null;
  mobile: string;
  role: Role;
}

/** Advisor/Admin/Business Partner: resolve a farmer's FarmsKing ID to their account — e.g. to apply a coupon on their behalf. */
export async function lookupByKingId(kingId: string): Promise<KingIdLookupResult> {
  const { data } = await apiClient.get<KingIdLookupResult>(`/users/lookup/${kingId}`);
  return data;
}

export interface BusinessPartnerSearchResult {
  id: string;
  name: string;
  kingId: string | null;
  mobile: string;
}

/** Advisor: type-search active Business Partners by name or king id, e.g. to share a self-generated coupon with one. */
export async function searchBusinessPartners(q: string): Promise<BusinessPartnerSearchResult[]> {
  const { data } = await apiClient.get<BusinessPartnerSearchResult[]>('/users/search/business-partners', { params: { q } });
  return data;
}

/** Self-service Account Deletion (Google Play Store Policy Requirement) */
export async function deleteMyAccount(): Promise<{ success: boolean; message: string }> {
  const { data } = await apiClient.delete<{ success: boolean; message: string }>('/users/me');
  return data;
}

/** Super Admin: Delete user record from database */
export async function deleteUserByAdmin(id: string): Promise<{ success: boolean; message: string }> {
  const { data } = await apiClient.delete<{ success: boolean; message: string }>(`/users/${id}`);
  return data;
}
