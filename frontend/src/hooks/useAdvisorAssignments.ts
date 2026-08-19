import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import * as advisorAssignmentsApi from '../api/advisorAssignments.api';

export function useFarmerStats() {
  return useQuery({ queryKey: ['advisor-assignments', 'stats'], queryFn: advisorAssignmentsApi.getFarmerStats });
}

export function useFarmersList(status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'ALL') {
  return useQuery({
    queryKey: ['advisor-assignments', 'farmers', status],
    queryFn: () => advisorAssignmentsApi.listFarmers(status),
  });
}

export function useFarmerDetail(farmerId: string | undefined) {
  return useQuery({
    queryKey: ['advisor-assignments', 'farmers', 'detail', farmerId],
    queryFn: () => advisorAssignmentsApi.getFarmerDetail(farmerId as string),
    enabled: !!farmerId,
  });
}

/** Fetches farm/plot/crop-cycle detail for a batch of farmers in parallel — used to flatten into one plots table. */
export function useFarmerDetails(farmerIds: string[]) {
  return useQueries({
    queries: farmerIds.map((farmerId) => ({
      queryKey: ['advisor-assignments', 'farmers', 'detail', farmerId],
      queryFn: () => advisorAssignmentsApi.getFarmerDetail(farmerId),
    })),
  });
}

export function useMyAdvisor() {
  return useQuery({ queryKey: ['advisor-assignments', 'my-advisor'], queryFn: advisorAssignmentsApi.getMyAdvisor });
}

/** Farmer/Gardener: browse advisors of the matching type they could choose. */
export function useAvailableAdvisors(enabled: boolean = true) {
  return useQuery({
    queryKey: ['advisor-assignments', 'available'],
    queryFn: advisorAssignmentsApi.listAvailableAdvisors,
    enabled,
  });
}

/** Advisor nudges a formerly-assigned (now inactive) farmer to renew their plan. */
export function useSendRenewalReminder() {
  return useMutation({
    mutationFn: (farmerId: string) => advisorAssignmentsApi.sendRenewalReminder(farmerId),
  });
}

/** Farmer/Gardener: their most recent still-open hire request, awaiting the advisor's accept/reject. */
export function useMyPendingRequest() {
  return useQuery({ queryKey: ['advisor-assignments', 'my-pending-request'], queryFn: advisorAssignmentsApi.getMyPendingRequest });
}

export function useAcceptAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => advisorAssignmentsApi.acceptAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisor-assignments'] });
    },
  });
}

export function useRejectAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => advisorAssignmentsApi.rejectAssignment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisor-assignments'] });
    },
  });
}
