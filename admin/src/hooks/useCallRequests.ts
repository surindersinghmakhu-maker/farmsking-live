import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/callRequests.api';

export function useCreateCallRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createCallRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['call-requests'] }),
  });
}

/** Farmer's own currently-open call request, if any — polled so the "Call Request" button
 * reflects live state (green while pending, reverts once the advisor resolves it). */
export function useMyPendingCallRequest(enabled: boolean = true) {
  return useQuery({
    queryKey: ['call-requests', 'mine', 'pending'],
    queryFn: api.getMyPendingCallRequest,
    enabled,
    refetchInterval: 15_000,
  });
}

export function useMyCallRequests() {
  return useQuery({ queryKey: ['call-requests', 'mine'], queryFn: api.listMyCallRequests });
}

export function useResolveCallRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) => api.resolveCallRequest(id, comment),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['call-requests'] }),
  });
}
