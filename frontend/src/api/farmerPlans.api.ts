import { apiClient } from './client';

export type FarmerPlanType = 'FREE' | 'PRO' | 'SMART' | 'SUPER' | 'VIP' | 'BASIC' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'ROYAL';

export interface MyFarmerPlanResponse {
  farmerId: string;
  plan: FarmerPlanType;
  startDate: string | null;
  endDate: string | null;
  isExpired: boolean;
  inGrace: boolean;
  expiringSoon: boolean;
  daysUntilExpiry: number | null;
  hasUsedTrial?: boolean;
  limits: {
    maxTotalCrops: number | null;
    maxActiveCrops: number | null;
    maxAdvisorCrops: number | null;
    fullCompletedCropDetails: boolean;
    advisorIncluded: boolean;
  };
}

export interface FarmerPlanCouponPreview {
  code: string;
  plan: FarmerPlanType;
  /** The plan the farmer will actually be on after redemption — same as `plan` unless they already
   * have a higher tier active, in which case the current (higher) tier is kept and the coupon's days
   * are just added on top of it instead of downgrading them. */
  resultPlan: FarmerPlanType;
  daysGranted: number;
  currentPlan: FarmerPlanType;
  newEndDate: string;
  extendsExisting: boolean;
  includesAdvisor: boolean;
  price?: number;
  doctor?: { name: string; specialization: string; kingId?: string } | null;
  advisor?: { name: string; specialization: string; kingId?: string } | null;
  features?: string[];
}

export interface FarmerPlanCouponRedeemResult {
  plan: { plan: FarmerPlanType; endDate: string | null };
  daysGranted: number;
  newEndDate: string;
  extended: boolean;
  advisorHired: boolean;
  /** True if this coupon's tier was lower than the farmer's already-active plan — their current (higher) plan was kept and only extended by the coupon's days. */
  keptHigherPlan: boolean;
}

export interface FarmerPlanCoupon {
  id: string;
  code: string;
  category?: 'FARMER_PLAN' | 'ADVISOR_PLAN' | 'DOCTOR_CONSULTATION';
  plan: FarmerPlanType;
  daysGranted: number;
  assignedFarmerId: string | null;
  assignedFarmer?: { id: string; name: string; mobile: string; kingId?: string } | null;
  assignedAdvisorId: string | null;
  assignedAdvisor?: { id: string; name: string; mobile: string; kingId?: string; specialization?: string } | null;
  assignedBusinessPartnerId: string | null;
  assignedBusinessPartner?: { id: string; name: string; mobile: string } | null;
  doctorKingId?: string | null;
  advisorKingId?: string | null;
  isUsed: boolean;
  usedAt: string | null;
  usedByFarmerId?: string | null;
  usedByFarmer?: { id: string; name: string; mobile: string; kingId?: string } | null;
  expiresAt: string | null;
  generationCostAmount: string | null;
  payoutAmount?: string | null;
  payoutRecipientId?: string | null;
  createdAt: string;
  createdById: string;
  createdByRole?: string | null;
  createdBy?: { id: string; name: string; specialization?: string; kingId?: string } | null;
}

export interface CouponFinancialSummary {
  directAdminIncome: number;
  partnerDebitsCollected: number;
  advisorPlatformFeesCollected: number;
  totalCouponIncome: number;
  totalCouponsCount: number;
  usedCouponsCount: number;
  unusedCouponsCount: number;
}

export async function getCouponFinancialSummary(): Promise<CouponFinancialSummary> {
  const { data } = await apiClient.get<CouponFinancialSummary>('/farmer-plans/financial-summary');
  return data;
}


export interface CreateFarmerPlanCouponPayload {
  plan: FarmerPlanType;
  daysGranted: number;
  quantity?: number;
  assignedFarmerId?: string;
  assignedAdvisorId?: string;
  assignedBusinessPartnerId?: string;
  expiresAt?: string;
}

export interface FarmerPlanPricing {
  id: string;
  plan: FarmerPlanType;
  mrp?: string | null;
  price: string;
  billingPeriodDays: number;
  isOffer?: boolean;
  offerName?: string | null;
  offerPrice?: string | null;
  offerValidTill?: string | null;
  partnerShareType: 'PERCENTAGE' | 'FIXED';
  partnerShareValue: string;
  advisorShareValue: string | null;
  adminShareValue: string | null;
  partnerGenerationCostPercent: string | null;
  advisorGenerationCostPercent: string | null;
  maxTotalCrops?: number | null;
  maxActiveCrops?: number | null;
  advisorIncluded?: boolean;
  chatEnabled?: boolean;
  weatherEnabled?: boolean;
  gardenAdvisorIncluded?: boolean;
  isActive?: boolean;
  updatedAt: string;
}

export interface UpdateFarmerPlanPricingPayload {
  mrp?: number;
  price?: number;
  billingPeriodDays?: number;
  isOffer?: boolean;
  offerName?: string;
  offerPrice?: number;
  offerValidTill?: string;
  partnerShareType?: 'PERCENTAGE' | 'FIXED';
  partnerShareValue?: number;
  advisorShareValue?: number;
  adminShareValue?: number;
  partnerGenerationCostPercent?: number;
  advisorGenerationCostPercent?: number;
  maxTotalCrops?: number;
  maxActiveCrops?: number;
  advisorIncluded?: boolean;
  chatEnabled?: boolean;
  weatherEnabled?: boolean;
  gardenAdvisorIncluded?: boolean;
  isActive?: boolean;
}

export async function getMyFarmerPlan(): Promise<MyFarmerPlanResponse> {
  const { data } = await apiClient.get<MyFarmerPlanResponse>('/farmer-plans/my-plan');
  return data;
}

export async function previewFarmerPlanCoupon(code: string, farmerId?: string): Promise<FarmerPlanCouponPreview> {
  const { data } = await apiClient.get<FarmerPlanCouponPreview>(`/farmer-plans/coupon/${code}/preview`, {
    params: farmerId ? { farmerId } : {},
  });
  return data;
}

export async function redeemFarmerPlanCoupon(code: string, farmerId?: string, advisorId?: string): Promise<FarmerPlanCouponRedeemResult> {
  const { data } = await apiClient.post<FarmerPlanCouponRedeemResult>('/farmer-plans/redeem', { code, farmerId, advisorId });
  return data;
}

export async function createFarmerPlanCoupon(payload: CreateFarmerPlanCouponPayload): Promise<FarmerPlanCoupon[]> {
  const { data } = await apiClient.post<FarmerPlanCoupon[]>('/farmer-plans/coupons', payload);
  return data;
}

export async function listAllFarmerPlanCoupons(): Promise<FarmerPlanCoupon[]> {
  const { data } = await apiClient.get<FarmerPlanCoupon[]>('/farmer-plans/coupons');
  return data;
}

/** Super Admin: deactivate an unused coupon so it can no longer be redeemed — never deleted, stays in history. */
export async function deactivateFarmerPlanCoupon(id: string): Promise<FarmerPlanCoupon> {
  const { data } = await apiClient.patch<FarmerPlanCoupon>(`/farmer-plans/coupons/${id}/deactivate`);
  return data;
}

export async function listMineFarmerPlanCoupons(): Promise<FarmerPlanCoupon[]> {
  const { data } = await apiClient.get<FarmerPlanCoupon[]>('/farmer-plans/coupons/mine');
  return data;
}

export interface GenerateAdvisorCouponPayload {
  category?: 'FARMER_PLAN' | 'ADVISOR_PLAN' | 'DOCTOR_CONSULTATION';
  plan: FarmerPlanType;
  daysGranted: number;
  quantity?: number;
  targetType?: 'SELF' | 'ADVISOR';
  advisorKingId?: string;
  doctorFeeAmount?: number;
  includeMembership?: boolean;
  includedMembershipPlan?: FarmerPlanType;
  includedMembershipDays?: number;
  assignedFarmerId?: string;
  assignedBusinessPartnerId?: string;
}

/** Advisor self-service: generates their own plan coupon — the Super-Admin-configured generation cost is debited from their wallet. */
export async function generateOwnFarmerPlanCoupon(payload: GenerateAdvisorCouponPayload): Promise<FarmerPlanCoupon | FarmerPlanCoupon[]> {
  const { data } = await apiClient.post<FarmerPlanCoupon | FarmerPlanCoupon[]>('/farmer-plans/coupons/generate', payload);
  return data;
}

export interface GrantFarmerPlanDaysResult {
  plan: { plan: FarmerPlanType; endDate: string | null };
  daysAdded: number;
  newEndDate: string;
  advisorHired: boolean;
}

export interface GrantFarmerPlanDaysPayload {
  farmerId: string;
  daysGranted: number;
  plan?: FarmerPlanType;
  advisorId?: string;
}

export async function grantFarmerPlanDays(payload: GrantFarmerPlanDaysPayload): Promise<GrantFarmerPlanDaysResult> {
  const { data } = await apiClient.post<GrantFarmerPlanDaysResult>('/farmer-plans/grant-days', payload);
  return data;
}

export async function applyCouponToFarmerDirectly(code: string, farmerId: string): Promise<FarmerPlanCouponRedeemResult> {
  const { data } = await apiClient.post<FarmerPlanCouponRedeemResult>('/farmer-plans/apply-direct', { code, farmerId });
  return data;
}

export async function listMinePartnerFarmerPlanCoupons(): Promise<FarmerPlanCoupon[]> {
  const { data } = await apiClient.get<FarmerPlanCoupon[]>('/farmer-plans/coupons/mine-partner');
  return data;
}

export async function getFarmerPlanPricing(): Promise<FarmerPlanPricing[]> {
  const { data } = await apiClient.get<FarmerPlanPricing[]>('/farmer-plans/pricing');
  return data;
}

export async function updateFarmerPlanPricing(plan: string, payload: UpdateFarmerPlanPricingPayload): Promise<FarmerPlanPricing> {
  const { data } = await apiClient.patch<FarmerPlanPricing>(`/farmer-plans/pricing/${plan}`, payload);
  return data;
}

export async function deleteFarmerPlanPricing(id: string) {
  const { data } = await apiClient.delete<{ success: boolean }>(`/farmer-plans/pricing/item/${id}`);
  return data;
}

/** Farmer on STANDARD/PREMIUM: pick a specific Farm Advisor instead of the auto-assigned one. */
export async function chooseAdvisor(advisorId: string) {
  const { data } = await apiClient.post('/farmer-plans/choose-advisor', { advisorId });
  return data;
}

export interface AdminDocItem {
  key: string;
  title: string;
  fileName: string;
  description: string;
}

export async function getAdminDocsList(): Promise<AdminDocItem[]> {
  const { data } = await apiClient.get<AdminDocItem[]>('/farmer-plans/admin/docs/list');
  return data;
}

export async function downloadAdminDocContent(docKey: string, lang: string = 'en'): Promise<{ title: string; fileName: string; content: string; htmlPdfContent?: string }> {
  const { data } = await apiClient.get<{ title: string; fileName: string; content: string; htmlPdfContent?: string }>(`/farmer-plans/admin/docs/${docKey}/download`, { params: { lang } });
  return data;
}

export interface FarmerPlanHistoryRecord {
  id: string;
  farmerId: string;
  plan: FarmerPlanType;
  status: 'ACTIVE' | 'SLEEP' | 'EXPIRED' | 'REVOKED';
  daysGranted: number;
  remainingDays: number | null;
  startDate: string;
  endDate: string | null;
  sleptAt: string | null;
  resumedAt: string | null;
  notes: string | null;
  coupon?: { code: string; category?: string } | null;
  createdAt: string;
}

export interface FarmerPlanHistoryResponse {
  currentPlan: { plan: FarmerPlanType; endDate: string | null } | null;
  activeRecord?: FarmerPlanHistoryRecord | null;
  sleepRecords: FarmerPlanHistoryRecord[];
  pastRecords: FarmerPlanHistoryRecord[];
  allHistory: FarmerPlanHistoryRecord[];
}

export async function getFarmerPlanHistory(farmerId?: string): Promise<FarmerPlanHistoryResponse> {
  const { data } = await apiClient.get<FarmerPlanHistoryResponse>('/farmer-plans/history', { params: { farmerId } });
  return data;
}

export async function activateTrial(): Promise<{ message: string; plan: string; endDate: string }> {
  const { data } = await apiClient.post<{ message: string; plan: string; endDate: string }>('/farmer-plans/activate-trial');
  return data;
}


export const PLAN_DISPLAY_MAP: Record<string, { title: string; badge: string; icon: string; color: string; desc: string }> = {
  FREE: {
    title: 'Free Pass',
    badge: '🟢 Free Pass',
    icon: 'ticket-outline',
    color: '#10b981',
    desc: 'Free Entry (Mandi rates, basic weather updates, 30 free bill downloads/shares)',
  },
  PRO: {
    title: 'Kisan Card',
    badge: '📝 Kisan Card',
    icon: 'card-outline',
    color: '#0284c7',
    desc: 'Crop Digital Account (All crops list, active limit max 5 crops)',
  },
  BASIC: {
    title: 'Kisan Card',
    badge: '📝 Kisan Card',
    icon: 'card-outline',
    color: '#0284c7',
    desc: 'Crop Digital Account (All crops list, active limit max 5 crops)',
  },
  SMART: {
    title: 'Boss Card',
    badge: '👷 Boss Card',
    icon: 'briefcase-outline',
    color: '#d97706',
    desc: 'Crops + Labour Management (Unlimited crops + labour records and login)',
  },
  SILVER: {
    title: 'Boss Card',
    badge: '👷 Boss Card',
    icon: 'briefcase-outline',
    color: '#d97706',
    desc: 'Crops + Labour Management (Unlimited crops + labour records and login)',
  },
  SUPER: {
    title: 'King Card',
    badge: '👑 King Card',
    icon: 'ribbon-outline',
    color: '#6d28d9',
    desc: 'Super Farmer Estate (All crops + labour records + 5 team members access)',
  },
  VIP: {
    title: 'King Card',
    badge: '👑 King Card',
    icon: 'ribbon-outline',
    color: '#6d28d9',
    desc: 'Super Farmer Estate (All crops + labour records + 5 team members access)',
  },
  ROYAL: {
    title: 'King Card',
    badge: '👑 King Card',
    icon: 'ribbon-outline',
    color: '#6d28d9',
    desc: 'Super Farmer Estate (All crops + labour records + 5 team members access)',
  },
};

export type CardFeatureKey =
  | 'OTHER_STATES_MANDI_RATES'
  | 'PDF_DOWNLOAD'
  | 'WHATSAPP_SHARE'
  | 'UNLIMITED_ACTIVE_CROPS'
  | 'PHOTO_UPLOAD'
  | 'LABOUR_MANAGEMENT'
  | 'TEAM_SUPERVISORS';

export function checkCardPermission(
  plan: string | undefined | null,
  feature: CardFeatureKey,
  options?: { billCount?: number; lang?: string }
): { allowed: boolean; requiredCard: 'Kisan Card' | 'Boss Card' | 'King Card'; message: string } {
  const currentPlan = (plan || 'FREE').toUpperCase();
  const isPaid = currentPlan !== 'FREE';
  const isBossOrHigher = ['SMART', 'SILVER', 'SUPER', 'VIP', 'ROYAL', 'GOLD', 'PLATINUM', 'DIAMOND'].includes(currentPlan);
  const isKingOrHigher = ['SUPER', 'VIP', 'ROYAL', 'PLATINUM', 'DIAMOND'].includes(currentPlan);

  const activeLang = options?.lang || (typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('farmsking_user_language') : 'en') || 'en';
  const isPa = activeLang === 'pa';

  switch (feature) {
    case 'OTHER_STATES_MANDI_RATES':
      if (!isPaid) {
        return {
          allowed: false,
          requiredCard: 'Kisan Card',
          message: isPa
            ? 'ਦੂਜੇ ਰਾਜਾਂ (ਹਰਿਆਣਾ, ਰਾਜਸਥਾਨ, MP, ਦਿੱਲੀ) ਦੇ ਮੰਡੀ ਰੇਟ ਵੇਖਣ ਲਈ Kisan Card ਅਨਲੌਕ ਕਰੋ!'
            : 'Unlock Kisan Card to view live Mandi rates of other states (Haryana, Rajasthan, MP, Delhi)!',
        };
      }
      return { allowed: true, requiredCard: 'Kisan Card', message: '' };

    case 'PDF_DOWNLOAD':
    case 'WHATSAPP_SHARE':
      if (!isPaid) {
        const count = options?.billCount ?? 0;
        if (count <= 30) {
          return { allowed: true, requiredCard: 'Kisan Card', message: '' };
        }
        return {
          allowed: false,
          requiredCard: 'Kisan Card',
          message: isPa
            ? 'Free Pass ਵਿੱਚ 30 ਬਿਲਾਂ ਤੱਕ ਹੀ ਫ੍ਰੀ ਡਾਊਨਲੋਡ/ਸ਼ੇਅਰ ਮਿਲਦਾ ਹੈ। ਅਨਲਿਮਟਿਡ ਬਿਲਾਂ ਲਈ Kisan Card ਅਨਲੌਕ ਕਰੋ!'
            : 'Free Pass includes up to 30 bill downloads/shares. Unlock Kisan Card for unlimited bills!',
        };
      }
      return { allowed: true, requiredCard: 'Kisan Card', message: '' };

    case 'UNLIMITED_ACTIVE_CROPS':
      if (!isBossOrHigher) {
        return {
          allowed: false,
          requiredCard: 'Boss Card',
          message: isPa
            ? 'ਮੈਕਸੀਮਮ 5 ਫਸਲਾਂ (Kisan Card) ਤੋਂ ਵੱਧ ਅਨਲਿਮਟਿਡ ਫਸਲਾਂ ਜੋੜਨ ਲਈ Boss Card ਅਪਗ੍ਰੇਡ ਕਰੋ!'
            : 'Upgrade to Boss Card to manage unlimited active crops beyond the 5-crop limit!',
        };
      }
      return { allowed: true, requiredCard: 'Boss Card', message: '' };

    case 'PHOTO_UPLOAD':
      if (!isBossOrHigher) {
        return {
          allowed: false,
          requiredCard: 'Boss Card',
          message: isPa
            ? 'ਫੋਟੋ ਅਪਲੋਡ (ਬੀਮਾਰ ਫਸਲ, ਬਿਲ ਸਕੈਨ) ਅਤੇ AI ਜਾਂਚ ਲਈ Boss Card ਅਪਗ੍ਰੇਡ ਕਰੋ!'
            : 'Upgrade to Boss Card for crop disease photo uploads, bill scans, and AI diagnostics!',
        };
      }
      return { allowed: true, requiredCard: 'Boss Card', message: '' };

    case 'LABOUR_MANAGEMENT':
      if (!isBossOrHigher) {
        return {
          allowed: false,
          requiredCard: 'Boss Card',
          message: isPa
            ? 'ਮਜ਼ਦੂਰ/ਲੇਬਰ ਹਿਸਾਬ, ਹਾਜ਼ਰੀ ਅਤੇ Labour Login ਚਾਲੂ ਕਰਨ ਲਈ Boss Card ਅਪਗ੍ਰੇਡ ਕਰੋ!'
            : 'Upgrade to Boss Card to enable labour records, attendance logs, and Labour Login!',
        };
      }
      return { allowed: true, requiredCard: 'Boss Card', message: '' };

    case 'TEAM_SUPERVISORS':
      if (!isKingOrHigher) {
        return {
          allowed: false,
          requiredCard: 'King Card',
          message: isPa
            ? 'ਆਪਣੇ ਨਾਲ 5 ਟੀਮ ਮੈਂਬਰ/ਸੁਪਰਵਾਈਜ਼ਰ ਜੋੜਨ ਲਈ King Card ਅਪਗ੍ਰੇਡ ਕਰੋ!'
            : 'Upgrade to King Card to add 5 team members or supervisors to your agricultural estate!',
        };
      }
      return { allowed: true, requiredCard: 'King Card', message: '' };

    default:
      return { allowed: true, requiredCard: 'Kisan Card', message: '' };
  }
}





