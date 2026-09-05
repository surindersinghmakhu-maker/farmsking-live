import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as partiesApi from '../api/parties.api';

export function useParties() {
  return useQuery({
    queryKey: ['parties'],
    queryFn: partiesApi.listParties,
  });
}

export function useCreateParty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: partiesApi.createParty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
    },
  });
}

export function useUpdateParty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: partiesApi.UpdatePartyPayload }) =>
      partiesApi.updateParty(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['unified-parties'] });
    },
  });
}

export function usePartyStatement(id: string | undefined) {
  return useQuery({
    queryKey: ['parties', id, 'statement'],
    queryFn: () => partiesApi.getPartyStatement(id as string),
    enabled: !!id,
  });
}

export function useRecordSaleLedger() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: partiesApi.RecordSaleLedgerPayload }) =>
      partiesApi.recordSaleLedger(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['parties', variables.id, 'statement'] });
    },
  });
}

export function useRecordPaymentReceived() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: partiesApi.RecordPaymentPayload }) =>
      partiesApi.recordPaymentReceived(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['parties', variables.id, 'statement'] });
      queryClient.invalidateQueries({ queryKey: ['payment-receipts', 'count', 'mine'] });
    },
  });
}

export function useRecordPaymentMade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: partiesApi.RecordPaymentPayload }) =>
      partiesApi.recordPaymentMade(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['parties', variables.id, 'statement'] });
      queryClient.invalidateQueries({ queryKey: ['payment-receipts', 'count', 'mine'] });
    },
  });
}

// ─── Unified Party System & Arhtiya Hooks ──────────────────────────────────

export function useUnifiedParties(role?: partiesApi.PartyRole) {
  return useQuery({
    queryKey: ['unified-parties', role],
    queryFn: () => partiesApi.listUnifiedParties(role),
  });
}

export function useCreateUnifiedParty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: partiesApi.createUnifiedParty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-parties'] });
    },
  });
}

export function useRecordArhtiyaAdvance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: partiesApi.recordArhtiyaAdvance,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['arhtiya-hisab', variables.partyId] });
      queryClient.invalidateQueries({ queryKey: ['unified-parties'] });
    },
  });
}

export function useRecordArhtiyaCropSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: partiesApi.recordArhtiyaCropSale,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['arhtiya-hisab', variables.partyId] });
      queryClient.invalidateQueries({ queryKey: ['unified-parties'] });
    },
  });
}

export function useArhtiyaHisab(partyId: string | undefined) {
  return useQuery({
    queryKey: ['arhtiya-hisab', partyId],
    queryFn: () => partiesApi.getArhtiyaLedgerHisab(partyId as string),
    enabled: !!partyId,
  });
}

