import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/appSettings.api';

export function useAppSettings() {
  return useQuery({
    queryKey: ['app-settings'],
    queryFn: api.getAppSettings,
  });
}

export function useSupportContact() {
  return useQuery({
    queryKey: ['app-settings', 'support-contact'],
    queryFn: api.getSupportContact,
  });
}

export function useUpdateAppSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.UpdateAppSettingsPayload) => api.updateAppSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      queryClient.invalidateQueries({ queryKey: ['app-settings', 'support-contact'] });
    },
  });
}
