import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsEnum, IsObject, Matches, Min, Max } from 'class-validator';
import { SellerKycStatus, SellerType, RtoBearer, CatalogApprovalMode } from '@prisma/client';
import { GSTIN_REGEX, PAN_REGEX, IFSC_REGEX, FSSAI_REGEX, AADHAAR_LAST4_REGEX } from '../../../common/utils/tax-compliance.util';

export class CreateSellerStoreDto {
  @IsNotEmpty()
  @IsString()
  storeName: string;

  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsOptional()
  @IsEnum(SellerType)
  sellerType?: SellerType;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @Matches(GSTIN_REGEX, { message: 'GSTIN must be a valid 15-character GSTIN.' })
  gstin?: string;

  @IsOptional()
  @IsBoolean()
  isCompositionDealer?: boolean;

  @IsOptional()
  @IsString()
  gstEnrolmentId?: string;

  @IsOptional()
  @Matches(PAN_REGEX, { message: 'PAN must be a valid 10-character PAN (e.g. ABCDE1234F).' })
  panNumber?: string;

  @IsOptional()
  @Matches(AADHAAR_LAST4_REGEX, { message: 'Aadhaar last 4 digits must be numeric.' })
  aadhaarLast4?: string;

  @IsOptional()
  @IsString()
  upiId?: string;

  @IsOptional()
  @IsString()
  bankAccountNo?: string;

  @IsOptional()
  @Matches(IFSC_REGEX, { message: 'Bank IFSC must be a valid 11-character IFSC code.' })
  bankIfsc?: string;

  @IsOptional()
  @IsString()
  bankBeneficiaryName?: string;

  @IsOptional()
  @IsString()
  pickupAddress?: string;

  @IsOptional()
  @IsString()
  pickupCity?: string;

  @IsOptional()
  @IsString()
  pickupState?: string;

  @IsOptional()
  @IsString()
  pickupPincode?: string;

  @IsOptional()
  @IsBoolean()
  wantsToSellFood?: boolean;

  @IsOptional()
  @Matches(FSSAI_REGEX, { message: 'FSSAI License must be 14 digits.' })
  fssaiNo?: string;

  @IsOptional()
  @IsString()
  fssaiCertificateUrl?: string;

  @IsOptional()
  @IsString()
  fssaiExpiryDate?: string;

  @IsOptional()
  @IsString()
  agriLicenseNo?: string;

  @IsOptional()
  @IsString()
  agriLicenseExpiryDate?: string;

  @IsOptional()
  @IsString()
  seedLicenseNo?: string;

  @IsOptional()
  @IsString()
  seedLicenseExpiry?: string;

  @IsOptional()
  @IsString()
  seedLicenseDocUrl?: string;

  @IsOptional()
  @IsString()
  pesticideLicenseNo?: string;

  @IsOptional()
  @IsString()
  pesticideLicenseExpiry?: string;

  @IsOptional()
  @IsString()
  pesticideLicenseDocUrl?: string;

  @IsOptional()
  @IsString()
  fertilizerLicenseNo?: string;

  @IsOptional()
  @IsString()
  fertilizerLicenseExpiry?: string;

  @IsOptional()
  @IsString()
  fertilizerLicenseDocUrl?: string;

  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;

  @IsOptional()
  @IsString()
  additionalDoc1Title?: string;

  @IsOptional()
  @IsString()
  additionalDoc1Url?: string;

  @IsOptional()
  @IsString()
  additionalDoc2Title?: string;

  @IsOptional()
  @IsString()
  additionalDoc2Url?: string;

  @IsOptional()
  @IsString()
  gstDocUrl?: string;

  @IsOptional()
  @IsString()
  panDocUrl?: string;

  @IsOptional()
  @IsString()
  chequeDocUrl?: string;

  @IsOptional()
  @IsString()
  aadhaarFrontUrl?: string;

  @IsOptional()
  @IsString()
  aadhaarBackUrl?: string;

  @IsOptional()
  @IsString()
  tradeLicenseUrl?: string;

  @IsOptional()
  @IsString()
  sellerPhotoUrl?: string;

  @IsOptional()
  @IsString()
  logoDocUrl?: string;
}

export class UpdateSellerKycDto {
  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsEnum(SellerType)
  sellerType?: SellerType;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @Matches(GSTIN_REGEX, { message: 'GSTIN must be a valid 15-character GSTIN.' })
  gstin?: string;

  @IsOptional()
  @IsBoolean()
  isCompositionDealer?: boolean;

  @IsOptional()
  @IsString()
  gstEnrolmentId?: string;

  @IsOptional()
  @Matches(PAN_REGEX, { message: 'PAN must be a valid 10-character PAN (e.g. ABCDE1234F).' })
  panNumber?: string;

  @IsOptional()
  @Matches(AADHAAR_LAST4_REGEX, { message: 'Aadhaar last 4 digits must be numeric.' })
  aadhaarLast4?: string;

  @IsOptional()
  @IsString()
  upiId?: string;

  @IsOptional()
  @IsString()
  bankAccountNo?: string;

  @IsOptional()
  @Matches(IFSC_REGEX, { message: 'Bank IFSC must be a valid 11-character IFSC code.' })
  bankIfsc?: string;

  @IsOptional()
  @IsString()
  bankBeneficiaryName?: string;

  @IsOptional()
  @IsString()
  pickupAddress?: string;

  @IsOptional()
  @IsString()
  pickupCity?: string;

  @IsOptional()
  @IsString()
  pickupState?: string;

  @IsOptional()
  @IsString()
  pickupPincode?: string;

  @IsOptional()
  @IsBoolean()
  wantsToSellFood?: boolean;

  @IsOptional()
  @Matches(FSSAI_REGEX, { message: 'FSSAI License must be 14 digits.' })
  fssaiNo?: string;

  @IsOptional()
  @IsString()
  fssaiCertificateUrl?: string;

  @IsOptional()
  @IsString()
  fssaiExpiryDate?: string;

  @IsOptional()
  @IsString()
  agriLicenseNo?: string;

  @IsOptional()
  @IsString()
  agriLicenseExpiryDate?: string;

  @IsOptional()
  @IsString()
  seedLicenseNo?: string;

  @IsOptional()
  @IsString()
  seedLicenseExpiry?: string;

  @IsOptional()
  @IsString()
  seedLicenseDocUrl?: string;

  @IsOptional()
  @IsString()
  pesticideLicenseNo?: string;

  @IsOptional()
  @IsString()
  pesticideLicenseExpiry?: string;

  @IsOptional()
  @IsString()
  pesticideLicenseDocUrl?: string;

  @IsOptional()
  @IsString()
  fertilizerLicenseNo?: string;

  @IsOptional()
  @IsString()
  fertilizerLicenseExpiry?: string;

  @IsOptional()
  @IsString()
  fertilizerLicenseDocUrl?: string;

  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;

  @IsOptional()
  @IsString()
  additionalDoc1Title?: string;

  @IsOptional()
  @IsString()
  additionalDoc1Url?: string;

  @IsOptional()
  @IsString()
  additionalDoc2Title?: string;

  @IsOptional()
  @IsString()
  additionalDoc2Url?: string;

  @IsOptional()
  @IsString()
  gstDocUrl?: string;

  @IsOptional()
  @IsString()
  panDocUrl?: string;

  @IsOptional()
  @IsString()
  chequeDocUrl?: string;

  @IsOptional()
  @IsString()
  aadhaarFrontUrl?: string;

  @IsOptional()
  @IsString()
  aadhaarBackUrl?: string;

  @IsOptional()
  @IsString()
  tradeLicenseUrl?: string;

  @IsOptional()
  @IsString()
  sellerPhotoUrl?: string;

  @IsOptional()
  @IsString()
  logoDocUrl?: string;
}

export class VerifySellerKycDto {
  @IsNotEmpty()
  @IsEnum(SellerKycStatus)
  status: SellerKycStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsNumber()
  commissionRate?: number;
}

export class UpdateSellerSettingsDto {
  @IsOptional()
  @IsNumber()
  commissionRate?: number;

  @IsOptional()
  @IsEnum(RtoBearer)
  rtoBearer?: RtoBearer;

  @IsOptional()
  @IsNumber()
  rtoSharedVendorRatio?: number;

  @IsOptional()
  @IsEnum(CatalogApprovalMode)
  catalogApprovalMode?: CatalogApprovalMode;

  @IsOptional()
  @IsBoolean()
  isFssaiApproved?: boolean;

  @IsOptional()
  @IsObject()
  categoryCommissions?: Record<string, number>;
}


