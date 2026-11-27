import { apiClient } from './client';

export interface DoctorSettingsResponse {
  advisorId: string;
  advisorName: string;
  advisorMobile: string;
  advisorKingId?: string | null;

  // 1. Contact Privacy & Communication Channels
  showMobileNumber: boolean;
  enableWhatsApp: boolean;
  enableGsmCalling: boolean;
  enableInAppAudioCall: boolean;
  enableVideoCall: boolean;

  // 2. Consultation Plans & Pricing
  monthlyPlanEnabled: boolean;
  monthlyFee: number;
  monthlyCallLimit: number;
  monthlyInAppCallLimit: number;
  monthlyVideoCallLimit: number;
  monthlyVideoAllowed: boolean;
  monthlyChatEnabled: boolean;

  // 3-Month Pack
  plan3MonthsEnabled: boolean;
  fee3Months: number;
  callLimit3Months: number;
  videoAllowed3Months: boolean;

  // 6-Month Pack
  plan6MonthsEnabled: boolean;
  fee6Months: number;
  callLimit6Months: number;
  videoAllowed6Months: boolean;

  // 12-Month Annual Pack
  plan12MonthsEnabled: boolean;
  fee12Months: number;
  callLimit12Months: number;
  videoAllowed12Months: boolean;

  cropSeasonPlanEnabled: boolean;
  cropSeasonFee: number;
  cropSeasonCallLimit: number;
  cropSeasonVideoAllowed: boolean;

  singleConsultationPlanEnabled: boolean;
  singleConsultationFee: number;
  allCropsSelected: boolean;
  specializedCrops: string[];
  freeConsultationEnabled: boolean;

  // 3. Availability & Practice Timings
  availabilityStatus: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  workingHoursStart: string;
  workingHoursEnd: string;
  emergencyConsultation: boolean;
  welcomeGreeting: string;

  // 4. Agronomy Credential & Prescriptions Signature
  icarRegistrationNumber: string;
  qualificationTitle: string;
  maxFarmerCapacity: number;
}

export async function getDoctorSettings(advisorId?: string): Promise<DoctorSettingsResponse> {
  const { data } = await apiClient.get<DoctorSettingsResponse>('/advisor-assignments/doctor-settings', {
    params: advisorId ? { advisorId } : {},
  });
  return data;
}

export async function updateDoctorSettings(
  dto: Partial<DoctorSettingsResponse>,
  advisorId?: string,
): Promise<DoctorSettingsResponse> {
  const { data } = await apiClient.patch<DoctorSettingsResponse>('/advisor-assignments/doctor-settings', dto, {
    params: advisorId ? { advisorId } : {},
  });
  return data;
}
