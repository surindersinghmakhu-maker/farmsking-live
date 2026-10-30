export type Role =
  | 'FARMER'
  | 'ADVISOR'
  | 'GARDENER'
  | 'CUSTOMER'
  | 'BUSINESS_PARTNER'
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'OPERATOR';
export type AdvisorType = 'FARM' | 'GARDEN';
export type AreaUnit = 'ACRE' | 'HECTARE' | 'BIGHA' | 'GUNTA';
export type SoilType =
  | 'ALLUVIAL'
  | 'BLACK'
  | 'RED'
  | 'LATERITE'
  | 'SANDY'
  | 'CLAY'
  | 'LOAMY'
  | 'SALINE_ALKALINE';
export type WaterType = 'BOREWELL_TUBEWELL' | 'CANAL' | 'RIVER' | 'POND_LAKE' | 'RAINFED' | 'TAP_MUNICIPAL';
export type SprayTankSizeL = 15 | 20 | 25;
export type CropStatus = 'PLANNED' | 'ACTIVE' | 'HARVESTING' | 'COMPLETED' | 'FAILED';
export type CropCategory =
  | 'FLOWERS'
  | 'VEGETABLES'
  | 'FRUITS'
  | 'GRAINS'
  | 'PULSES'
  | 'SPICES'
  | 'CASH_CROP'
  | 'OTHER';
export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'CARD' | 'OTHER';

export interface User {
  id: string;
  kingId?: string | null;
  mobile: string;
  role: Role;
  name: string;
  email?: string | null;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  preferredLanguage: string;
  photoUrl?: string | null;
  sprayTankSizeL?: SprayTankSizeL | null;
  soilType?: SoilType | null;
  waterType?: WaterType | null;
  specialization?: string | null;
  bio?: string | null;
  yearsExperience?: number | null;
  advisorType?: AdvisorType | null;
  createdAt: string;
}

export interface FarmerProfileStatus {
  profileComplete: boolean;
  missingFields: ('photoUrl' | 'sprayTankSizeL' | 'soilType' | 'waterType')[];
  profile: {
    photoUrl: string | null;
    sprayTankSizeL: SprayTankSizeL | null;
    soilType: SoilType | null;
    waterType: WaterType | null;
  };
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface AdminUser {
  id: string;
  kingId?: string | null;
  mobile: string;
  role: Role;
  name: string;
  email?: string | null;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  preferredLanguage: string;
  advisorType?: AdvisorType | null;
  createdAt: string;
  deletedAt?: string | null;
}

export interface ListUsersResponse {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export interface Farm {
  id: string;
  ownerId: string;
  name: string;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  totalArea: number;
  areaUnit: AreaUnit;
  soilType?: string | null;
  irrigationSource?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Plot {
  id: string;
  farmId: string;
  name: string;
  area: number;
  areaUnit: AreaUnit;
  soilType?: string | null;
  irrigationType?: string | null;
  waterSource?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  key: string;
  labelEn: string;
  labelHi: string;
  icon?: string | null;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface Expense {
  id: string;
  farmId: string;
  plotId?: string | null;
  cropCycleId?: string | null;
  categoryId: string;
  category: ExpenseCategory;
  machineryId?: string | null;
  amount: string;
  expenseDate: string;
  paymentMode?: PaymentMode | null;
  vendorName?: string | null;
  description?: string | null;
  quantity?: number | null;
  unit?: string | null;
  receiptPhotoUrl?: string | null;
  recordedById: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AdvisorAssignmentStatus = 'PENDING' | 'ACTIVE' | 'REVOKED';
export type SubscriptionPlanStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export interface AdvisorPlan {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  billingCycle: string;
  isActive: boolean;
}

export interface FarmerBasic {
  id: string;
  name: string;
  mobile: string;
  village?: string | null;
  district?: string | null;
  state?: string | null;
}

export interface AdvisorSubscription {
  id: string;
  farmerId: string;
  planId: string;
  plan: AdvisorPlan;
  status: SubscriptionPlanStatus;
  requestedAt: string;
  approvedAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  cancelledAt?: string | null;
}

export interface AdvisorAssignment {
  id: string;
  advisorId: string;
  farmerId: string;
  status: AdvisorAssignmentStatus;
  startDate: string;
  endDate?: string | null;
  advisor?: FarmerBasic;
  farmer?: FarmerBasic;
  subscription?: AdvisorSubscription;
}

export interface FarmerStats {
  total: number;
  active: number;
  inactive: number;
}

export interface FarmerDetail {
  farmer: FarmerBasic & {
    createdAt: string;
    farms: (Farm & { plots: (Plot & { cropCycles: CropCycle[] })[] })[];
  };
  assignment: AdvisorAssignment;
  isExpired: boolean;
}

export interface CropCycle {
  id: string;
  plotId: string;
  category?: CropCategory | null;
  cropName: string;
  variety?: string | null;
  area?: number | null;
  plantCount?: number | null;
  sowingDate?: string | null;
  transplantDate?: string | null;
  expectedHarvestDate?: string | null;
  actualHarvestDate?: string | null;
  status: CropStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType = 'IRRIGATION' | 'FERTILIZER' | 'SPRAY' | 'MONITORING' | 'HARVEST' | 'OTHER';
export type ActivityStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED' | 'OVERDUE';

export interface CropActivitySchedule {
  id: string;
  cropCycleId: string;
  activityType: ActivityType;
  title: string;
  description?: string | null;
  scheduledDate: string;
  status: ActivityStatus;
  completedAt?: string | null;
  completedById?: string | null;
  createdByAdvisorId: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  cropCycle?: {
    id: string;
    cropName: string;
    plot?: {
      id: string;
      name: string;
      farm?: { id: string; name: string; owner?: { id: string; name: string; mobile: string } };
    };
  };
}

export type CropProblemSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CropProblemStatus = 'REPORTED' | 'UNDER_REVIEW' | 'ADVISOR_RESPONDED' | 'RESOLVED' | 'CLOSED';

export interface CropProblemPhoto {
  id: string;
  cropProblemId: string;
  photoUrl: string;
  caption?: string | null;
  uploadedAt: string;
}

export interface CropProblem {
  id: string;
  cropCycleId: string;
  reportedById: string;
  title: string;
  description: string;
  severity?: CropProblemSeverity | null;
  status: CropProblemStatus;
  assignedAdvisorId?: string | null;
  advisorResponse?: string | null;
  recommendedProduct?: string | null;
  followUpDate?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  photos: CropProblemPhoto[];
  reportedBy?: { id: string; name: string; mobile: string };
  assignedAdvisor?: { id: string; name: string; mobile: string };
  cropCycle?: { id: string; cropName: string; plot?: { id: string; name: string; farmId: string } };
}

export type NotificationType =
  | 'SPRAY_REMINDER'
  | 'PAYMENT_DUE'
  | 'ADVISOR_MESSAGE'
  | 'CROP_PROBLEM_UPDATE'
  | 'MARKET_RATE_ALERT'
  | 'SYSTEM';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export type DiscountValueType = 'PERCENTAGE' | 'FIXED';

export interface Coupon {
  id: string;
  code: string;
  businessPartnerId: string;
  businessPartner?: { id: string; name: string; mobile: string };
  commissionType: DiscountValueType;
  commissionValue: string;
  commissionMaxCap?: string | null;
  discountType: DiscountValueType;
  discountValue: string;
  discountMaxCap?: string | null;
  expiresAt: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface CouponRedemption {
  id: string;
  couponId: string;
  customerId?: string | null;
  customer?: { id: string; name: string; mobile: string } | null;
  orderId?: string | null;
  orderAmount: string;
  discountAmount: string;
  commissionAmount: string;
  creditedAt?: string | null;
  redeemedAt: string;
}

export type WalletTransactionType = 'CREDIT' | 'DEBIT';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTransactionType;
  amount: string;
  reason: string;
  createdAt: string;
}

export interface MyWallet {
  balance: number;
  transactions: WalletTransaction[];
}

export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface WithdrawalRequest {
  id: string;
  businessPartnerId: string;
  businessPartner?: { id: string; name: string; mobile: string };
  requestedAmount: string;
  approvedAmount?: string | null;
  status: WithdrawalStatus;
  requestedAt: string;
  processedAt?: string | null;
  notes?: string | null;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  unit: string;
  price: string;
  imageUrl?: string | null;
  stockQty: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'PACKING' | 'PACKED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

export interface CustomerOrderItem {
  id: string;
  orderId: string;
  productId?: string | null;
  product?: { id: string; name: string; imageUrl?: string | null } | null;
  productName: string;
  quantity: number;
  price: string;
}

export interface CustomerOrder {
  id: string;
  customerId: string;
  customer?: { id: string; name: string; mobile: string };
  orderNumber: string;
  totalAmount: string;
  status: OrderStatus;
  deliveryAddress?: string | null;
  orderDate: string;
  deliveryDate?: string | null;
  packedById?: string | null;
  packedBy?: { id: string; name: string } | null;
  packedAt?: string | null;
  dispatchedById?: string | null;
  dispatchedBy?: { id: string; name: string } | null;
  dispatchedAt?: string | null;
  courierName?: string | null;
  trackingId?: string | null;
  cancelledAt?: string | null;
  couponId?: string | null;
  discountAmount?: string | null;
  items: CustomerOrderItem[];
}

export interface TreatmentTemplateTask {
  id: string;
  templateId: string;
  dayNumber: number;
  treatmentName: string;
}

export interface TreatmentTemplate {
  id: string;
  problemTitle: string;
  cropCategory?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tasks: TreatmentTemplateTask[];
}

export type WeatherTipTrigger = 'HIGH_TEMPERATURE' | 'RAIN' | 'COLD';

export interface WeatherTipTemplate {
  id: string;
  title: string;
  message: string;
  triggerType: WeatherTipTrigger;
  thresholdC?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface ChatConversation {
  partner: { id: string; name: string; mobile: string; photoUrl?: string | null };
  lastMessage: ChatMessage | null;
  unreadCount: number;
}

export interface PlanRenewalCoupon {
  id: string;
  code: string;
  daysGranted: number;
  assignedFarmerId?: string | null;
  assignedFarmer?: { id: string; name: string; mobile: string } | null;
  assignedAdvisorId?: string | null;
  assignedAdvisor?: { id: string; name: string; mobile: string } | null;
  isUsed: boolean;
  usedAt?: string | null;
  bonusDayApplied: boolean;
  createdAt: string;
}
