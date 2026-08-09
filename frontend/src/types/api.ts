export type Role = 'FARMER' | 'ADVISOR' | 'ADMIN';
export type AreaUnit = 'ACRE' | 'HECTARE' | 'BIGHA' | 'GUNTA';
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
  mobile: string;
  role: Role;
  name: string;
  email?: string | null;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  preferredLanguage: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
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
