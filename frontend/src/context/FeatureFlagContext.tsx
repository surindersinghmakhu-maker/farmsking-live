import React, { createContext, useContext, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  const { data: flags = null, isLoading: loading, refetch: fetchFlags } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const res = await apiClient.get('/app-settings/feature-flags');
      return res.data;
    }
  });

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

  const updateFlagsMutation = useMutation({
    mutationFn: async (newFlags: FeatureFlagsMap) => {
      const res = await apiClient.patch('/app-settings/feature-flags', newFlags);
      return res.data?.featureFlags || newFlags;
    },
    onSuccess: (updatedFlags) => {
      queryClient.setQueryData(['feature-flags'], updatedFlags);
    },
    onError: (err) => {
      console.error('Failed to update feature flags:', err);
    }
  });

  const updateFlags = useCallback(async (newFlags: FeatureFlagsMap) => {
    await updateFlagsMutation.mutateAsync(newFlags);
  }, [updateFlagsMutation]);

  return (
    <FeatureFlagContext.Provider
      value={{
        flags,
        loading,
        isFeatureEnabled,
        refreshFlags: async () => { await fetchFlags(); },
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
