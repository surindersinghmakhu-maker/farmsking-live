import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { FeatureFlagsMap } from '../types/feature-flags';
import { apiClient } from '../api/client';

interface FeatureFlagContextType {
  flags: FeatureFlagsMap | null;
  loading: boolean;
  isFeatureEnabled: (category: string, subCategory?: string) => boolean;
  refreshFlags: () => Promise<void>;
  updateFlags: (newFlags: FeatureFlagsMap) => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<FeatureFlagsMap | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchFlags = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/app-settings/feature-flags');
      setFlags(res.data);
    } catch (err) {
      console.warn('Could not fetch feature flags:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const isFeatureEnabled = useCallback(
    (category: string, subCategory?: string): boolean => {
      if (!flags) return true; // Default to open if loading/fallback
      const catObj = flags[category];
      if (!catObj || catObj.enabled === false) return false;

      if (subCategory && catObj.subCategories) {
        const subObj = catObj.subCategories[subCategory];
        if (subObj && subObj.enabled === false) return false;
      }

      return true;
    },
    [flags]
  );

  const updateFlags = useCallback(async (newFlags: FeatureFlagsMap) => {
    try {
      setLoading(true);
      const res = await apiClient.patch('/app-settings/feature-flags', newFlags);
      if (res.data?.featureFlags) {
        setFlags(res.data.featureFlags);
      } else {
        setFlags(newFlags);
      }
    } catch (err) {
      console.error('Failed to update feature flags:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <FeatureFlagContext.Provider
      value={{
        flags,
        loading,
        isFeatureEnabled,
        refreshFlags: fetchFlags,
        updateFlags,
      }}
    >
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
};
