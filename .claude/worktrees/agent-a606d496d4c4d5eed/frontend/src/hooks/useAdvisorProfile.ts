import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMyAdvisorProfile, UpdateAdvisorProfilePayload } from '../api/users.api';

export function useUpdateAdvisorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAdvisorProfilePayload) => updateMyAdvisorProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'admin-list'] });
    },
  });
}
