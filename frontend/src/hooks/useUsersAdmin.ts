import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/users.api';
import { OperatorPermission, Role } from '../types/api';

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

export function useLookupByKingId() {
  return useMutation({
    mutationFn: (kingId: string) => api.lookupByKingId(kingId),
  });
}

export function useSearchBusinessPartners(q: string) {
  return useQuery({
    queryKey: ['users', 'search-business-partners', q],
    queryFn: () => api.searchBusinessPartners(q),
    enabled: q.trim().length > 0,
  });
}

export function useUserDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['users', 'detail', id],
    queryFn: () => api.getUserDetail(id as string),
    enabled: !!id,
  });
}

export function useUpdateActiveRoles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activeRoles }: { id: string; activeRoles: Role[] }) => api.updateActiveRoles(id, activeRoles),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users', 'admin-list'] }),
  });
}

export function useUpdateOperatorPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: OperatorPermission[] }) =>
      api.updateOperatorPermissions(id, permissions),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users', 'admin-list'] }),
  });
}

export function useAdminUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: api.AdminUpdateUserPayload }) => api.adminUpdateUser(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'admin-list'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'detail', variables.id] });
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword?: string }) => api.resetUserPassword(id, newPassword),
  });
}
