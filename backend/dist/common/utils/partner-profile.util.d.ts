export declare const BUSINESS_PARTNER_PROFILE_FIELDS: readonly ["upiId", "panNumber", "alternativeMobile", "email", "bankAccountNumber", "bankIfsc", "bankAccountHolderName"];
export declare const ADVISOR_PROFILE_FIELDS: readonly ["photoUrl", "qualification", "profileTitle", "upiId", "panNumber", "alternativeMobile", "email", "bankAccountNumber", "bankIfsc", "bankAccountHolderName"];
export type ProfileField = (typeof ADVISOR_PROFILE_FIELDS)[number];
type ProfileFieldValues = Partial<Record<ProfileField, string | null>>;
export declare function getPartnerProfileStatus(user: ProfileFieldValues): {
    profileComplete: boolean;
    missingFields: ("email" | "upiId" | "panNumber" | "alternativeMobile" | "bankAccountNumber" | "bankIfsc" | "bankAccountHolderName")[];
};
export declare function getAdvisorPayoutProfileStatus(user: ProfileFieldValues): {
    profileComplete: boolean;
    missingFields: ("email" | "photoUrl" | "qualification" | "profileTitle" | "upiId" | "panNumber" | "alternativeMobile" | "bankAccountNumber" | "bankIfsc" | "bankAccountHolderName")[];
};
export {};
