import { useMutation } from '@tanstack/react-query';
import * as usersApi from '../api/users.api';

export function useBecomeFarmer() {
  return useMutation({ mutationFn: (payload?: usersApi.UpdateFarmerProfilePayload) => usersApi.becomeFarmer(payload) });
}

export function useBecomeGardener() {
  return useMutation({ mutationFn: usersApi.becomeGardener });
}
