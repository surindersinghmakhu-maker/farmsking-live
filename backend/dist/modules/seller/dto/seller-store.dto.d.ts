import { SellerKycStatus, SellerType, RtoBearer, CatalogApprovalMode } from '@prisma/client';
export declare class CreateSellerStoreDto {
    storeName: string;
    slug: string;
    sellerType?: SellerType;
    legalName?: string;
    gstin?: string;
    panNumber?: string;
    bankAccountNo?: string;
    bankIfsc?: string;
    bankBeneficiaryName?: string;
    pickupAddress?: string;
    pickupCity?: string;
    pickupState?: string;
    pickupPincode?: string;
    wantsToSellFood?: boolean;
    fssaiNo?: string;
    fssaiCertificateUrl?: string;
    fssaiExpiryDate?: string;
    agriLicenseNo?: string;
    agriLicenseExpiryDate?: string;
    additionalDoc1Title?: string;
    additionalDoc1Url?: string;
    additionalDoc2Title?: string;
    additionalDoc2Url?: string;
    gstDocUrl?: string;
    panDocUrl?: string;
    chequeDocUrl?: string;
    aadhaarFrontUrl?: string;
    aadhaarBackUrl?: string;
    tradeLicenseUrl?: string;
}
export declare class UpdateSellerKycDto {
    storeName?: string;
    slug?: string;
    sellerType?: SellerType;
    legalName?: string;
    gstin?: string;
    panNumber?: string;
    bankAccountNo?: string;
    bankIfsc?: string;
    bankBeneficiaryName?: string;
    pickupAddress?: string;
    pickupCity?: string;
    pickupState?: string;
    pickupPincode?: string;
    wantsToSellFood?: boolean;
    fssaiNo?: string;
    fssaiCertificateUrl?: string;
    fssaiExpiryDate?: string;
    agriLicenseNo?: string;
    agriLicenseExpiryDate?: string;
    additionalDoc1Title?: string;
    additionalDoc1Url?: string;
    additionalDoc2Title?: string;
    additionalDoc2Url?: string;
    gstDocUrl?: string;
    panDocUrl?: string;
    chequeDocUrl?: string;
    aadhaarFrontUrl?: string;
    aadhaarBackUrl?: string;
    tradeLicenseUrl?: string;
}
export declare class VerifySellerKycDto {
    status: SellerKycStatus;
    rejectionReason?: string;
    commissionRate?: number;
}
export declare class UpdateSellerSettingsDto {
    commissionRate?: number;
    rtoBearer?: RtoBearer;
    rtoSharedVendorRatio?: number;
    catalogApprovalMode?: CatalogApprovalMode;
    isFssaiApproved?: boolean;
}
