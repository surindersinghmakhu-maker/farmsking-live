import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSystemIntegrations,
  updateSystemIntegrations,
  SystemIntegrationsConfig,
} from '@/src/api/appSettings.api';

export const SYSTEM_INTEGRATIONS_QUERY_KEY = ['system-integrations'];

export function useSystemIntegrations() {
  return useQuery<SystemIntegrationsConfig>({
    queryKey: SYSTEM_INTEGRATIONS_QUERY_KEY,
    queryFn: getSystemIntegrations,
    staleTime: 60 * 1000,
  });
}

export function useUpdateSystemIntegrations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<SystemIntegrationsConfig>) => updateSystemIntegrations(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(SYSTEM_INTEGRATIONS_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      queryClient.invalidateQueries({ queryKey: SYSTEM_INTEGRATIONS_QUERY_KEY });
    },
  });
}
