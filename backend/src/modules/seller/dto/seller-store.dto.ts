import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsEnum, Min, Max } from 'class-validator';
import { SellerKycStatus, SellerType, RtoBearer, CatalogApprovalMode } from '@prisma/client';

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
  @IsString()
  gstin?: string;

  @IsOptional()
  @IsString()
  panNumber?: string;

  @IsOptional()
  @IsString()
  bankAccountNo?: string;

  @IsOptional()
  @IsString()
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
  @IsString()
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
  @IsString()
  gstin?: string;

  @IsOptional()
  @IsString()
  panNumber?: string;

  @IsOptional()
  @IsString()
  bankAccountNo?: string;

  @IsOptional()
  @IsString()
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
  @IsString()
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
}


