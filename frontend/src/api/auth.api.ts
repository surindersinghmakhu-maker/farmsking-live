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

export async function googleLoginApi(payload: GoogleLoginPayload): Promise<AuthResponse & { isProfileIncomplete?: boolean; missingFields?: string[] }> {
  const { data } = await apiClient.post<AuthResponse & { isProfileIncomplete?: boolean; missingFields?: string[] }>('/auth/google-login', payload);
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
