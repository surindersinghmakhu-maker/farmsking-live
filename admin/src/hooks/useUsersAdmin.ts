import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/users.api';
import { OperatorPermission, Role } from '../types/api';
import { executeWithAdminStepUpOtp } from '@/components/AdminStepUpProvider';

export function useUsersList(params: api.ListUsersParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['users', 'admin-list', params],
    queryFn: () => api.listUsers(params),
    enabled: options?.enabled ?? true,
    refetchInterval: 20_000,
  });
}

export function useCreateAdvisor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createAdvisor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users', 'admin-list'] }),
  });
}

export function useCreateTrainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createTrainer,
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

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      executeWithAdminStepUpOtp({
        title: 'Authorize Permanent User Deletion',
        description:
          'Permanently anonymizing a user account requires a 6-digit Super Admin Step-Up 2FA code.',
        execute: (otp) => api.deleteUserByAdmin(id, otp),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'admin-list'] });
    },
  });
}

export function useCreateAssistantDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createAssistantDoctor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-assistant-doctors'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'admin-list'] });
    },
  });
}

export function useCreateManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createManager,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users', 'admin-list'] }),
  });
}

export function useCreateAccountant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createAccountant,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users', 'admin-list'] }),
  });
}

export function useResignSupervisor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.resignSupervisor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'admin-list'] });
    },
  });
}

export function useAssignSupervisorEmployer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, employerFarmerId }: { id: string; employerFarmerId: string | null }) =>
      api.assignSupervisorEmployer(id, employerFarmerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'admin-list'] });
    },
  });
}

export function usePartnerApplications(status?: string) {
  return useQuery({
    queryKey: ['users', 'partner-applications', status ?? 'ALL'],
    queryFn: () => api.listPartnerApplications(status),
  });
}

export function useApprovePartnerApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      executeWithAdminStepUpOtp({
        title: 'Authorize Partner KYC Approval',
        description:
          'Approving a Partner application activates live dashboard access and links KYC & King ID records. Enter your 6-digit Admin Step-Up 2FA code.',
        execute: (otp) => api.approvePartnerApplication(id, otp),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'partner-applications'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'admin-list'] });
    },
  });
}

export function useRejectPartnerApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.rejectPartnerApplication(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'partner-applications'] });
    },
  });
}

export function useVerifiedLeads(params?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ['users', 'verified-leads', params?.status ?? 'ALL', params?.search ?? ''],
    queryFn: () => api.listVerifiedSignupLeads(params),
  });
}

export function useUpdateVerifiedLeadNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: api.UpdateVerifiedLeadNotesPayload }) =>
      api.updateVerifiedLeadNotes(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'verified-leads'] });
    },
  });
}

export function useConvertVerifiedLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: api.ConvertVerifiedLeadPayload }) =>
      api.convertVerifiedLeadToUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'verified-leads'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'admin-list'] });
    },
  });
}

export function useAdminCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.AdminCreateUserPayload) => api.adminCreateUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'admin-list'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'verified-leads'] });
    },
  });
}

