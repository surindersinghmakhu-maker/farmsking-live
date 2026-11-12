import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSystemIntegrations,
  updateSystemIntegrations,
  SystemIntegrationsConfig,
} from '@/src/api/appSettings.api';
import { executeWithAdminStepUpOtp } from '@/components/AdminStepUpProvider';

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
    mutationFn: async (payload: Partial<SystemIntegrationsConfig> & { adminConfirmationOtp?: string }) => {
      if (payload.adminConfirmationOtp) {
        return updateSystemIntegrations(payload);
      }
      return executeWithAdminStepUpOtp({
        title: 'Authorize System Configuration Update',
        description:
          'Enter the 6-digit Admin Step-Up 2FA confirmation code to save platform integrations and master settings.',
        execute: (adminConfirmationOtp) =>
          updateSystemIntegrations({
            ...payload,
            adminConfirmationOtp,
          }),
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(SYSTEM_INTEGRATIONS_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      queryClient.invalidateQueries({ queryKey: SYSTEM_INTEGRATIONS_QUERY_KEY });
    },
  });
}
