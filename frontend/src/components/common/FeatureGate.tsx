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
        <h3 className="font-bold text-amber-900 text-lg">ਇਹ ਸੁਵਿਧਾ ਫਿਲਹਾਲ ਬੰਦ ਹੈ</h3>
        <p className="text-amber-700 text-sm mt-1">
          ਐਡਮਿਨ ਦੁਆਰਾ ਇਹ ਮੋਡਿਊਲ ({category} {subCategory ? `> ${subCategory}` : ''}) ਟੈਂਪਰੇਰੀ ਤੌਰ 'ਤੇ OFF ਕੀਤਾ ਗਿਆ ਹੈ।
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
