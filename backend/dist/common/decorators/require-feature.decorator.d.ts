export declare const FEATURE_FLAG_KEY = "feature_flag_requirement";
export interface FeatureRequirement {
    category: string;
    subCategory?: string;
}
export declare const RequireFeature: (category: string, subCategory?: string) => import("@nestjs/common").CustomDecorator<string>;
