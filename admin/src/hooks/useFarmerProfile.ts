import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyProfileStatus, updateMyFarmerProfile, UpdateFarmerProfilePayload } from '../api/users.api';
import { useAuth } from '../store/auth-context';

export function useFarmerProfileStatus(enabled: boolean = true) {
  return useQuery({
    queryKey: ['users', 'me', 'profile-status'],
    queryFn: getMyProfileStatus,
    enabled,
  });
}

export function useUpdateFarmerProfile() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();
  return useMutation({
    mutationFn: (payload: UpdateFarmerProfilePayload) => updateMyFarmerProfile(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'profile-status'] });
      updateUser(data as any);
    },
  });
}
