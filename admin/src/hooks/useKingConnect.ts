import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/kingConnect.api';

// ─── Connection Hooks ─────────────────────────────────────────────────────────

export function useMyConnections() {
  return useQuery({
    queryKey: ['king-connect', 'connections'],
    queryFn: api.listMyConnections,
  });
}

export function usePendingConnections() {
  return useQuery({
    queryKey: ['king-connect', 'connections', 'pending'],
    queryFn: api.listPendingConnections,
    refetchInterval: 30_000, // Poll every 30s
  });
}

export function useSendConnectRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.sendConnectRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['king-connect'] });
    },
  });
}

export function useRespondToConnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ linkId, response }: { linkId: string; response: 'ACCEPTED' | 'DECLINED' }) =>
      api.respondToConnect(linkId, response),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['king-connect'] });
    },
  });
}

export function useToggleAutoAccept() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (linkId: string) => api.toggleAutoAccept(linkId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['king-connect', 'connections'] });
    },
  });
}

// ─── P2P Sync Hooks ───────────────────────────────────────────────────────────

export function usePendingSync() {
  return useQuery({
    queryKey: ['king-connect', 'sync', 'pending'],
    queryFn: api.listPendingSync,
    refetchInterval: 20_000, // Poll every 20s for live updates
  });
}

export function useSyncHistory() {
  return useQuery({
    queryKey: ['king-connect', 'sync', 'history'],
    queryFn: api.listSyncHistory,
  });
}

export function useCreateSyncRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createSyncRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['king-connect', 'sync'] });
    },
  });
}

export function useRespondToSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ syncId, payload }: {
      syncId: string;
      payload: { response: 'ACCEPTED' | 'REJECTED' | 'COUNTER_PROPOSED'; rejectionReason?: string; counterAmount?: number; counterNote?: string };
    }) => api.respondToSync(syncId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['king-connect', 'sync'] });
    },
  });
}

// ─── Demand Request Hooks ─────────────────────────────────────────────────────

export function useIncomingDemands() {
  return useQuery({
    queryKey: ['king-connect', 'demands', 'incoming'],
    queryFn: () => api.listDemands('incoming'),
    refetchInterval: 30_000,
  });
}

export function useOutgoingDemands() {
  return useQuery({
    queryKey: ['king-connect', 'demands', 'outgoing'],
    queryFn: () => api.listDemands('outgoing'),
  });
}

export function useCreateDemand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createDemandRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['king-connect', 'demands'] });
    },
  });
}

export function useRespondToDemand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ demandId, payload }: {
      demandId: string;
      payload: { response: 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED'; acceptedQty?: number; counterNote?: string; rejectionReason?: string };
    }) => api.respondToDemand(demandId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['king-connect', 'demands'] });
    },
  });
}

// ─── Payment Request Hooks ────────────────────────────────────────────────────

export function useIncomingPaymentRequests() {
  return useQuery({
    queryKey: ['king-connect', 'payment-requests', 'incoming'],
    queryFn: () => api.listPaymentRequests('incoming'),
    refetchInterval: 30_000,
  });
}

export function useOutgoingPaymentRequests() {
  return useQuery({
    queryKey: ['king-connect', 'payment-requests', 'outgoing'],
    queryFn: () => api.listPaymentRequests('outgoing'),
  });
}

export function useCreatePaymentRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createPaymentRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['king-connect', 'payment-requests'] });
    },
  });
}

export function useRespondToPaymentRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, payload }: {
      requestId: string;
      payload: { response: 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'POSTPONED' | 'REJECTED'; acceptedAmount?: number; postponedDate?: string; rejectionReason?: string; notes?: string };
    }) => api.respondToPaymentRequest(requestId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['king-connect', 'payment-requests'] });
    },
  });
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

export function useKingActivityFeed() {
  return useQuery({
    queryKey: ['king-connect', 'activity'],
    queryFn: api.getActivityFeed,
    refetchInterval: 60_000,
  });
}

export function useSharedLedger(linkId: string | undefined) {
  return useQuery({
    queryKey: ['king-connect', 'shared-ledger', linkId],
    queryFn: () => api.getSharedLedger(linkId!),
    enabled: !!linkId,
  });
}

// ─── Combined count for notification badge ────────────────────────────────────

export function useKingConnectPendingCount() {
  const { data: pendingConnections = [] } = usePendingConnections();
  const { data: pendingSync = [] } = usePendingSync();
  const { data: incomingDemands = [] } = useIncomingDemands();
  const { data: incomingPayments = [] } = useIncomingPaymentRequests();

  const pendingSyncFiltered = pendingSync.filter((s) => s.status === 'PENDING');
  const pendingDemandsFiltered = incomingDemands.filter((d) => d.status === 'PENDING');
  const pendingPaymentsFiltered = incomingPayments.filter((p) => p.status === 'PENDING' || p.status === 'POSTPONED');

  return (
    pendingConnections.length +
    pendingSyncFiltered.length +
    pendingDemandsFiltered.length +
    pendingPaymentsFiltered.length
  );
}
