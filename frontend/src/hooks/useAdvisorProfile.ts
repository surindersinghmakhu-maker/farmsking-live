import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMyAdvisorProfile, updateMyAddress, UpdateAdvisorProfilePayload, UpdateMyAddressPayload } from '../api/users.api';
import { useAuth } from '../store/auth-context';

export function useUpdateAdvisorProfile() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();
  return useMutation({
    mutationFn: (payload: UpdateAdvisorProfilePayload) => updateMyAdvisorProfile(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'admin-list'] });
      updateUser(data as any);
    },
  });
}

/** Shared self-service profile update (name/email/photo/address) — same endpoint for every role. */
export function useUpdateMyAddress() {
  const { updateUser } = useAuth();
  return useMutation({
    mutationFn: (payload: UpdateMyAddressPayload) => updateMyAddress(payload),
    onSuccess: (data) => {
      updateUser(data as any);
    },
  });
}
