import { apiClient } from './client';
import { AuthResponse, SoilType, SprayTankSizeL, WaterType } from '../types/api';

export interface RegisterPayload {
  firebaseIdToken?: string;
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
  farmName?: string;
  farmAddress?: string;
  farmMobile?: string;
  whatsappGroupEnabled?: boolean;
  termsAccepted?: boolean;
}

export type LoginPortalMode = 'CLIENT' | 'PARTNER';

export interface LoginPayload {
  mobile: string;
  password: string;
  captchaToken?: string;
  portal?: LoginPortalMode;
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

export async function firebaseForgotPasswordReset(payload: { idToken: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
  const { data } = await apiClient.post('/auth/forgot-password/firebase-reset', payload);
  return data;
}

export async function logoutOtherSessions(): Promise<{ success: boolean; message: string; loggedOutCount: number }> {
  const { data } = await apiClient.post('/auth/logout-other-sessions');
  return data;
}

export async function verifyAccountPassword(password: string, mobile?: string): Promise<{ success: boolean; message: string }> {
  const { data } = await apiClient.post<{ success: boolean; message: string }>('/auth/verify-password', { password, mobile });
  return data;
}

export interface GoogleLoginPayload {
  email?: string;
  name?: string;
  photoUrl?: string;
  googleId?: string;
  accessToken?: string;
  idToken?: string;
  portal?: LoginPortalMode;
}

export async function googleLoginApi(payload: GoogleLoginPayload): Promise<AuthResponse & { requiresMobileVerification?: boolean; isProfileIncomplete?: boolean; missingFields?: string[] }> {
  const { data } = await apiClient.post<AuthResponse & { requiresMobileVerification?: boolean; isProfileIncomplete?: boolean; missingFields?: string[] }>('/auth/google-login', payload);
  return data;
}

export async function linkGoogleApi(payload: GoogleLoginPayload): Promise<{ success: boolean; message: string; user: any }> {
  const { data } = await apiClient.post<{ success: boolean; message: string; user: any }>('/auth/link-google', payload);
  return data;
}

export async function unlinkGoogleApi(): Promise<{ success: boolean; message: string; user: any }> {
  const { data } = await apiClient.post<{ success: boolean; message: string; user: any }>('/auth/unlink-google');
  return data;
}

export async function sendMobileLinkOtpApi(mobile: string): Promise<{ success: boolean; message: string; devOtp?: string }> {
  const { data } = await apiClient.post<{ success: boolean; message: string; devOtp?: string }>('/auth/send-mobile-link-otp', { mobile });
  return data;
}

export async function verifyMobileLinkOtpApi(payload: { mobile: string; otp: string; password?: string }): Promise<{ success: boolean; message: string; isMerged?: boolean; user: any; accessToken?: string }> {
  const { data } = await apiClient.post<{ success: boolean; message: string; isMerged?: boolean; user: any; accessToken?: string }>('/auth/verify-mobile-link-otp', payload);
  return data;
}

export async function firebaseMobileLinkApi(payload: { idToken: string; password?: string }): Promise<{ success: boolean; message: string; isMerged?: boolean; user: any; accessToken?: string }> {
  const { data } = await apiClient.post<{ success: boolean; message: string; isMerged?: boolean; user: any; accessToken?: string }>('/auth/firebase-mobile-link', payload);
  return data;
}

export async function sendLoginOtpApi(
  mobile: string,
  portal?: LoginPortalMode,
): Promise<{ success: boolean; message: string; devOtp?: string; isNewUser?: boolean }> {
  const { data } = await apiClient.post<{ success: boolean; message: string; devOtp?: string; isNewUser?: boolean }>(
    '/auth/send-login-otp',
    { mobile, ...(portal ? { portal } : {}) },
  );
  return data;
}

export async function verifyLoginOtpApi(payload: {
  mobile: string;
  otp: string;
  portal?: LoginPortalMode;
}): Promise<AuthResponse & { isNewUser?: boolean; mobile?: string }> {
  const { data } = await apiClient.post<AuthResponse & { isNewUser?: boolean; mobile?: string }>('/auth/verify-login-otp', payload);
  return data;
}

export interface CompleteOtpRegistrationPayload {
  mobile: string;
  name?: string;
  role: 'CUSTOMER' | 'FARMER' | 'GARDENER';
  portal?: LoginPortalMode;
  termsAccepted?: boolean;
}

export async function completeOtpRegistrationApi(
  payload: CompleteOtpRegistrationPayload
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/complete-otp-registration', payload);
  return data;
}

export async function firebaseLoginApi(
  idToken: string,
  portal?: LoginPortalMode,
): Promise<AuthResponse & { isNewUser?: boolean; mobile?: string; message?: string }> {
  const { data } = await apiClient.post<AuthResponse & { isNewUser?: boolean; mobile?: string; message?: string }>(
    '/auth/firebase-login',
    { idToken, ...(portal ? { portal } : {}) },
  );
  return data;
}

export async function sendEmailVerificationApi(
  email: string,
  origin?: string,
): Promise<{ success: boolean; message: string; pendingEmail?: string }> {
  const { data } = await apiClient.post<{ success: boolean; message: string; pendingEmail?: string }>(
    '/auth/send-email-verification',
    { email, origin },
  );
  return data;
}

export async function verifyEmailApi(
  token: string,
): Promise<{ success: boolean; message: string; email?: string; user?: any }> {
  const { data } = await apiClient.post<{ success: boolean; message: string; email?: string; user?: any }>(
    '/auth/verify-email',
    { token },
  );
  return data;
}

export interface PartnerUserSummary {
  id: string;
  kingId: string | null;
  name: string;
  mobile: string;
  email?: string | null;
  activeRoles: string[];
  pincode?: string | null;
  postOffice?: string | null;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  photoUrl?: string | null;
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
}

export interface PartnerApplicationDto {
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
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  resubmissionCount: number;
  hasPassword: boolean;
  reviewedAt?: string | null;
  updatedAt: string;
}

export interface PartnerApplyPayload {
  mobile: string;
  requestedRole: 'AGENT' | 'ADVISOR' | 'SELLER';
  advisorType?: 'FARM' | 'GARDEN';
  name: string;
  email?: string;
  password?: string;
  pincode?: string;
  postOffice?: string;
  village?: string;
  district?: string;
  state?: string;
  qualification?: string;
  specialization?: string;
  yearsExperience?: number;
  bio?: string;
  panNumber: string;
  panDocUrl: string;
  aadhaarLast4: string;
  aadhaarDocUrl: string;
  aadhaarBackUrl?: string;
  gstin?: string;
  gstDocUrl?: string;
  bankAccountHolderName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  upiId?: string;
  chequeDocUrl: string;
  photoUrl: string;
  storeName?: string;
  legalName?: string;
  sellerType?: 'FARMER' | 'COMMERCIAL';
  pickupAddress?: string;
  termsAccepted: boolean;
}

export async function sendPartnerOtpApi(mobile: string): Promise<{
  success: boolean;
  mobile: string;
  sentViaWhatsApp: boolean;
  message: string;
  devOtp?: string;
}> {
  const { data } = await apiClient.post('/auth/partner-otp/send', { mobile });
  return data;
}

export async function verifyPartnerOtpApi(mobile: string, otp: string): Promise<{
  success: boolean;
  verified: boolean;
  mobile: string;
  partnerUploadToken: string;
  existingUserSummary: PartnerUserSummary | null;
  existingApplication: PartnerApplicationDto | null;
  activePartnerRoles: string[];
  message: string;
}> {
  const { data } = await apiClient.post('/auth/partner-otp/verify', { mobile, otp });
  return data;
}

export async function uploadPartnerKycDocApi(
  localUri: string,
  partnerUploadToken: string,
): Promise<{ success: boolean; fileUrl: string; provider?: string }> {
  const rawFilename = localUri.split('/').pop()?.split('?')[0] ?? `kyc-${Date.now()}.jpg`;
  const match = /\.(\w+)$/.exec(rawFilename);
  const rawExt = match?.[1]?.toLowerCase() ?? '';
  const validExts = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
  const ext = validExts.includes(rawExt) ? rawExt : 'jpg';
  const filename = rawFilename.replace(/\.\w+$/, '') + `.${ext}`;
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const formData = new FormData();
  if (typeof window !== 'undefined' && typeof Blob !== 'undefined' && (localUri.startsWith('blob:') || localUri.startsWith('data:'))) {
    const response = await fetch(localUri);
    const blob = await response.blob();
    formData.append('file', blob, filename);
  } else {
    formData.append('file', {
      uri: localUri,
      name: filename,
      type: mimeType,
    } as unknown as Blob);
  }

  const { data } = await apiClient.post<{ success: boolean; fileUrl: string; provider?: string }>(
    '/auth/partner-upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-partner-upload-token': partnerUploadToken,
      },
    },
  );
  return data;
}

export async function submitPartnerApplicationApi(payload: PartnerApplyPayload): Promise<{
  success: boolean;
  applicationId: string;
  status: string;
  requestedRole: string;
  existingKingId: string | null;
  message: string;
}> {
  const { data } = await apiClient.post('/auth/partner-apply', payload);
  return data;
}
