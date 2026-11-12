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

export async function createTrainer(payload: CreateStaffPayload): Promise<CreateAdvisorResponse> {
  const { data } = await apiClient.post<CreateAdvisorResponse>('/users/trainers', payload);
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

export async function createManager(payload: CreateStaffPayload): Promise<CreateAdvisorResponse> {
  const { data } = await apiClient.post<CreateAdvisorResponse>('/users/managers', payload);
  return data;
}

export async function createAccountant(payload: CreateStaffPayload): Promise<CreateAdvisorResponse> {
  const { data } = await apiClient.post<CreateAdvisorResponse>('/users/accountants', payload);
  return data;
}

export async function promoteToBusinessPartner(id: string): Promise<AdminUser> {
  const { data } = await apiClient.patch<AdminUser>(`/users/${id}/role`, { role: 'AGENT' });
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
  billPrintingAddress?: string;
  farmName?: string;
  farmAddress?: string;
  farmMobile?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankAccountHolderName?: string;
  isSeniorDoctor?: boolean;
  seniorDoctorId?: string;
  doctorConsultationFee?: number;
  employerFarmerId?: string | null;
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

/** The checkbox-toggleable roles — Admin Panel staff roles (Super Admin, Admin, Manager, Operator, Technical Trainer) are single-role via Staff flows. */
export const ASSIGNABLE_CHECKBOX_ROLES: Role[] = [
  'CUSTOMER',
  'FARMER',
  'GARDENER',
  'SUPERVISOR' as Role,
  'LABOUR' as Role,
  'AGENT',
  'SELLER' as Role,
  'ADVISOR',
  'TRADER' as Role,
];

export async function updateActiveRoles(id: string, activeRoles: Role[]): Promise<AdminUser> {
  const { data } = await apiClient.patch<AdminUser>(`/users/${id}/active-roles`, { activeRoles });
  return data;
}

export async function resignSupervisor(id: string): Promise<{ success: boolean; message: string; supervisor: AdminUser }> {
  const { data } = await apiClient.post<{ success: boolean; message: string; supervisor: AdminUser }>(`/users/my-supervisors/${id}/resign`);
  return data;
}

export async function assignSupervisorEmployer(id: string, employerFarmerId: string | null): Promise<AdminUser> {
  const { data } = await apiClient.patch<AdminUser>(`/users/supervisors/${id}/assign-employer`, { employerFarmerId });
  return data;
}

export interface UpdateFarmerProfilePayload {
  name?: string;
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
  farmName?: string;
  farmAddress?: string;
  farmMobile?: string;
  whatsappGroupEnabled?: boolean;
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
  upiId?: string;
  billPrintingAddress?: string;
  farmName?: string;
  farmAddress?: string;
  farmMobile?: string;
  notificationsEnabled?: boolean;
  whatsappGroupEnabled?: boolean;
  /** Null clears the threshold (alert off); a number sets and enables it. */
  weatherAlertMinTempC?: number | null;
  weatherAlertMaxTempC?: number | null;
  weatherAlertRainEnabled?: boolean;
  locationPreference?: 'GPS' | 'PROFILE';
  gpsLat?: number;
  gpsLng?: number;
  gpsLocationName?: string;
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

/** Advisor/Admin/Agent: resolve a farmer's FarmsKing ID to their account — e.g. to apply a coupon on their behalf. */
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

/** Advisor: type-search active Agents by name or king id, e.g. to share a self-generated coupon with one. */
export async function searchBusinessPartners(q: string): Promise<BusinessPartnerSearchResult[]> {
  const { data } = await apiClient.get<BusinessPartnerSearchResult[]>('/users/search/business-partners', { params: { q } });
  return data;
}

/** Self-service Account Deletion (Google Play Store Policy Requirement) */
export async function requestDeleteMeOtp(mobile?: string): Promise<{
  success: boolean;
  deliveredVia?: string[];
  message: string;
  devOtp?: string;
}> {
  const { data } = await apiClient.post('/users/me/delete-otp', { mobile });
  return data;
}

export async function deleteMyAccount(payload?: {
  otp?: string;
  firebaseIdToken?: string;
}): Promise<{ success: boolean; message: string }> {
  const { data } = await apiClient.delete<{ success: boolean; message: string }>('/users/me', {
    data: payload,
    headers: payload?.otp ? { 'x-delete-otp': payload.otp } : undefined,
  });
  return data;
}

/** Super Admin: Delete user record from database (requires mandatory Admin Step-Up 2FA OTP) */
export async function deleteUserByAdmin(id: string, adminConfirmationOtp?: string): Promise<{ success: boolean; message: string }> {
  const { data } = await apiClient.delete<{ success: boolean; message: string }>(`/users/${id}`, {
    data: adminConfirmationOtp ? { adminConfirmationOtp } : undefined,
    headers: adminConfirmationOtp ? { 'x-admin-otp': adminConfirmationOtp } : undefined,
  });
  return data;
}

export interface CreateAssistantDoctorPayload {
  name: string;
  mobile: string;
  password?: string;
  specialization?: string;
  doctorConsultationFee?: number;
  qualification?: string;
  profileTitle?: string;
  advisorType?: 'FARM' | 'GARDEN';
}

export async function createAssistantDoctor(payload: CreateAssistantDoctorPayload): Promise<{ user: AdminUser; tempPassword?: string }> {
  const { data } = await apiClient.post<{ user: AdminUser; tempPassword?: string }>('/users/my-assistant-doctors', payload);
  return data;
}

export async function getMyAssistantDoctors(): Promise<AdminUser[]> {
  const { data } = await apiClient.get<AdminUser[]>('/users/my-assistant-doctors');
  return data;
}

export interface PartnerApplicationItem {
  id: string;
  mobile: string;
  requestedRole: 'AGENT' | 'ADVISOR' | 'SELLER';
  advisorType?: 'FARM' | 'GARDEN' | null;
  name: string;
  email?: string | null;
  pincode?: string | null;
  postOffice?: string | null;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  qualification?: string | null;
  specialization?: string | null;
  yearsExperience?: number | null;
  bio?: string | null;
  panNumber?: string | null;
  panDocUrl?: string | null;
  aadhaarLast4?: string | null;
  aadhaarDocUrl?: string | null;
  aadhaarBackUrl?: string | null;
  gstin?: string | null;
  gstDocUrl?: string | null;
  bankAccountHolderName?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
  upiId?: string | null;
  chequeDocUrl?: string | null;
  photoUrl?: string | null;
  storeName?: string | null;
  legalName?: string | null;
  sellerType?: 'FARMER' | 'COMMERCIAL' | null;
  pickupAddress?: string | null;
  isPhoneVerified: boolean;
  termsAcceptedAt?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  resubmissionCount: number;
  hasPassword: boolean;
  applicantUserId?: string | null;
  applicantUser?: {
    id: string;
    name: string;
    kingId: string | null;
    mobile: string;
    role: Role;
    roles: Role[];
    deactivatedRoles: Role[];
  } | null;
  reviewedBy?: {
    id: string;
    name: string;
  } | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listPartnerApplications(status?: string): Promise<PartnerApplicationItem[]> {
  const { data } = await apiClient.get<PartnerApplicationItem[]>('/users/partner-applications', {
    params: status && status !== 'ALL' ? { status } : undefined,
  });
  return data;
}

export async function approvePartnerApplication(
  id: string,
  adminConfirmationOtp?: string,
): Promise<{ success: boolean; application: PartnerApplicationItem; user: AdminUser; message: string }> {
  const { data } = await apiClient.post<{
    success: boolean;
    application: PartnerApplicationItem;
    user: AdminUser;
    message: string;
  }>(
    `/users/partner-applications/${id}/approve`,
    adminConfirmationOtp ? { adminConfirmationOtp } : {},
    adminConfirmationOtp ? { headers: { 'x-admin-otp': adminConfirmationOtp } } : undefined,
  );
  return data;
}

export async function rejectPartnerApplication(
  id: string,
  reason: string,
): Promise<{ success: boolean; application: PartnerApplicationItem; message: string }> {
  const { data } = await apiClient.post<{
    success: boolean;
    application: PartnerApplicationItem;
    message: string;
  }>(`/users/partner-applications/${id}/reject`, { reason });
  return data;
}

export type VerifiedLeadStatusType =
  | 'OTP_CONFIRMED'
  | 'COMPLETED_SELF'
  | 'CONVERTED_BY_ADMIN'
  | 'DISMISSED';

export interface VerifiedSignupLeadItem {
  id: string;
  mobile: string;
  sourceChannel: string;
  portal?: string | null;
  otpVerifiedAt: string;
  lastAttemptAt: string;
  attemptCount: number;
  ipAddress?: string | null;
  userAgent?: string | null;
  referralCode?: string | null;
  capturedName?: string | null;
  capturedEmail?: string | null;
  pincode?: string | null;
  district?: string | null;
  state?: string | null;
  village?: string | null;
  intendedRole?: string | null;
  adminNotes?: string | null;
  status: VerifiedLeadStatusType;
  convertedUserId?: string | null;
  convertedUser?: {
    id: string;
    kingId?: string | null;
    name: string;
    role: string;
    roles?: string[];
    mobile: string;
  } | null;
  convertedById?: string | null;
  convertedBy?: {
    id: string;
    name: string;
    kingId?: string | null;
    role: string;
  } | null;
  convertedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VerifiedLeadsResponse {
  items: VerifiedSignupLeadItem[];
  counts: {
    total: number;
    otpConfirmed: number;
    completedSelf: number;
    convertedByAdmin: number;
    dismissed: number;
  };
}

export interface UpdateVerifiedLeadNotesPayload {
  adminNotes?: string;
  capturedName?: string;
  capturedEmail?: string;
  pincode?: string;
  district?: string;
  state?: string;
  village?: string;
  intendedRole?: 'CUSTOMER' | 'FARMER' | 'GARDENER' | 'ADVISOR' | 'AGENT' | 'SELLER' | 'TRADER';
  status?: 'OTP_CONFIRMED' | 'DISMISSED';
}

export interface ConvertVerifiedLeadPayload {
  name: string;
  role: 'CUSTOMER' | 'FARMER' | 'GARDENER';
  pincode?: string;
  postOffice?: string;
  village?: string;
  district?: string;
  state?: string;
  email?: string;
  sprayTankSizeL?: number;
  soilType?: string;
  waterType?: string;
  referralCode?: string;
  adminNotes?: string;
}

export async function listVerifiedSignupLeads(params?: {
  status?: string;
  search?: string;
}): Promise<VerifiedLeadsResponse> {
  const { data } = await apiClient.get<VerifiedLeadsResponse>('/users/verified-leads', {
    params: {
      ...(params?.status && params.status !== 'ALL' ? { status: params.status } : {}),
      ...(params?.search?.trim() ? { search: params.search.trim() } : {}),
    },
  });
  return data;
}

export async function updateVerifiedLeadNotes(
  id: string,
  payload: UpdateVerifiedLeadNotesPayload,
): Promise<{ success: boolean; lead: VerifiedSignupLeadItem; message: string }> {
  const { data } = await apiClient.patch<{
    success: boolean;
    lead: VerifiedSignupLeadItem;
    message: string;
  }>(`/users/verified-leads/${id}/notes`, payload);
  return data;
}

export async function convertVerifiedLeadToUser(
  id: string,
  payload: ConvertVerifiedLeadPayload,
): Promise<{ success: boolean; user: AdminUser; lead: VerifiedSignupLeadItem; message: string }> {
  const { data } = await apiClient.post<{
    success: boolean;
    user: AdminUser;
    lead: VerifiedSignupLeadItem;
    message: string;
  }>(`/users/verified-leads/${id}/convert`, payload);
  return data;
}

export type AdminCreateCategory = 'STAFF' | 'PARTNERS' | 'CLIENTS';
export type AdminCreateRoleKey =
  | 'ADMIN'
  | 'MANAGER'
  | 'OPERATOR'
  | 'TECHNICAL_TRAINER'
  | 'ACCOUNTANT'
  | 'AGENT'
  | 'SELLER'
  | 'FARM_ADVISOR'
  | 'GARDEN_ADVISOR'
  | 'TRADER'
  | 'FARMER'
  | 'GARDENER'
  | 'CUSTOMER'
  | 'SUPERVISOR';

export interface AdminCreateUserPayload {
  otpVerificationToken: string;
  category: AdminCreateCategory;
  role: AdminCreateRoleKey;
  mobile: string;
  name: string;
  email?: string;
  password?: string;
  pincode?: string;
  postOffice?: string;
  village?: string;
  district?: string;
  state?: string;
  address?: string;
  sprayTankSizeL?: number;
  soilType?: string;
  waterType?: string;
  farmName?: string;
  specialization?: string;
  qualification?: string;
  yearsExperience?: number;
  doctorConsultationFee?: number;
  bio?: string;
  panNumber?: string;
  upiId?: string;
  alternativeMobile?: string;
  bankAccountHolderName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  storeName?: string;
  sellerType?: string;
  gstin?: string;
  employerFarmerKingIdOrMobile?: string;
}

export async function sendAdminCreateUserOtp(mobile: string): Promise<{
  success: boolean;
  mobile: string;
  waSent: boolean;
  message: string;
  devOtp?: string;
}> {
  const { data } = await apiClient.post('/users/admin-create/send-otp', { mobile });
  return data;
}

export async function verifyAdminCreateUserOtp(mobile: string, otp: string): Promise<{
  success: boolean;
  verified: boolean;
  mobile: string;
  otpVerificationToken: string;
  message: string;
}> {
  const { data } = await apiClient.post('/users/admin-create/verify-otp', { mobile, otp });
  return data;
}

export async function adminCreateUser(payload: AdminCreateUserPayload): Promise<{
  success: boolean;
  user: AdminUser;
  tempPassword: string | null;
  message: string;
}> {
  const { data } = await apiClient.post('/users/admin-create', payload);
  return data;
}

