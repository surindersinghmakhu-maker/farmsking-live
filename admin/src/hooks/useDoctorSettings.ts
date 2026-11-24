import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/doctorSettings.api';

export function useDoctorSettings(advisorId?: string) {
  return useQuery({
    queryKey: ['doctor-settings', advisorId || 'me'],
    queryFn: () => api.getDoctorSettings(advisorId),
  });
}

export function useUpdateDoctorSettings(advisorId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<api.DoctorSettingsResponse>) => api.updateDoctorSettings(dto, advisorId),
    onSuccess: (data) => {
      queryClient.setQueryData(['doctor-settings', advisorId || 'me'], data);
      queryClient.invalidateQueries({ queryKey: ['doctor-settings'] });
      queryClient.invalidateQueries({ queryKey: ['advisors'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
