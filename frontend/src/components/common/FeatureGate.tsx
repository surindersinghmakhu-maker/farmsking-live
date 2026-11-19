import React from 'react';
import { useFeatureFlags } from '../../context/FeatureFlagContext';

interface FeatureGateProps {
  category: string;
  subCategory?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  category,
  subCategory,
  fallback,
  children,
}) => {
  const { isFeatureEnabled, loading } = useFeatureFlags();

  if (loading) {
    return null; // Silent while loading flags
  }

  const enabled = isFeatureEnabled(category, subCategory);

  if (!enabled) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="p-6 my-4 bg-amber-50 border border-amber-200 rounded-xl text-center shadow-sm">
        <span className="text-3xl mb-2 block">⚠️</span>
        <h3 className="font-bold text-amber-900 text-lg">Feature Temporarily Unavailable</h3>
        <p className="text-amber-700 text-sm mt-1">
          This module ({category} {subCategory ? `> ${subCategory}` : ''}) has been temporarily disabled by the administrator.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
