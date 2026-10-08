export interface PolicyPermissionModule {
    id: string;
    titleEn: string;
    titlePa: string;
    purposeEn: string;
    purposePa: string;
    dataCollected: string[];
    isMandatory: boolean;
}
export declare const DYNAMIC_SYSTEM_MODULES: PolicyPermissionModule[];
export declare function generateDynamicPrivacyPolicyHtml(baseUrl?: string): string;
export declare function generateAccountDeletionHtml(baseUrl?: string): string;
