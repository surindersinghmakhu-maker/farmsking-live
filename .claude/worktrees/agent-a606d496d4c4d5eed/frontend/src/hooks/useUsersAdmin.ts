import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/users.api';

export function useUsersList(params: api.ListUsersParams) {
  return useQuery({
    queryKey: ['users', 'admin-list', params],
    queryFn: () => api.listUsers(params),
  });
}

export function useCreateAdvisor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createAdvisor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users', 'admin-list'] }),
  });
}

export function useCreateOperator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createOperator,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users', 'admin-list'] }),
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createAdmin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users', 'admin-list'] }),
  });
}

export function usePromoteToBusinessPartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.promoteToBusinessPartner,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users', 'admin-list'] }),
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deactivateUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users', 'admin-list'] }),
  });
}

export function useReactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.reactivateUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users', 'admin-list'] }),
  });
}
