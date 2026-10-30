import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyProfileStatus, updateMyFarmerProfile, UpdateFarmerProfilePayload } from '../api/users.api';

export function useFarmerProfileStatus(enabled: boolean = true) {
  return useQuery({
    queryKey: ['users', 'me', 'profile-status'],
    queryFn: getMyProfileStatus,
    enabled,
  });
}

export function useUpdateFarmerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateFarmerProfilePayload) => updateMyFarmerProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'profile-status'] });
    },
  });
}
