import { SetMetadata } from '@nestjs/common';

export const FEATURE_FLAG_KEY = 'feature_flag_requirement';

export interface FeatureRequirement {
  category: string;
  subCategory?: string;
}

/**
 * Decorator to enforce Category or Sub-Category dynamic toggle checks on routes.
 * Example: @RequireFeature('shopping', 'saleBills')
 */
export const RequireFeature = (category: string, subCategory?: string) =>
  SetMetadata(FEATURE_FLAG_KEY, { category, subCategory });
