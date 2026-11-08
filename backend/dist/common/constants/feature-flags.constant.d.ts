export interface SubCategoryFlag {
    namePa: string;
    nameEn: string;
    enabled: boolean;
}
export interface CategoryFlag {
    namePa: string;
    nameEn: string;
    enabled: boolean;
    subCategories: Record<string, SubCategoryFlag>;
}
export type FeatureFlagsMap = Record<string, CategoryFlag>;
export declare const DEFAULT_FEATURE_FLAGS: FeatureFlagsMap;
