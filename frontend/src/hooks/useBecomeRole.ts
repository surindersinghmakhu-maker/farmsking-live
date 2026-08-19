import { useMutation } from '@tanstack/react-query';
import * as usersApi from '../api/users.api';

export function useBecomeFarmer() {
  return useMutation({ mutationFn: usersApi.becomeFarmer });
}

export function useBecomeGardener() {
  return useMutation({ mutationFn: usersApi.becomeGardener });
}
