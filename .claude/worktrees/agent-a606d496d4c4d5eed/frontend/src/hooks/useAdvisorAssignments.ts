import { useQueries, useQuery } from '@tanstack/react-query';
import * as advisorAssignmentsApi from '../api/advisorAssignments.api';

export function useFarmerStats() {
  return useQuery({ queryKey: ['advisor-assignments', 'stats'], queryFn: advisorAssignmentsApi.getFarmerStats });
}

export function useFarmersList(status: 'ACTIVE' | 'INACTIVE' | 'ALL') {
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
