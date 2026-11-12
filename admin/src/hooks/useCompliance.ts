import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/compliance.api';

export function useCaSummary() {
  return useQuery({
    queryKey: ['compliance', 'ca-summary'],
    queryFn: api.getCaSummary,
  });
}

export function useComplianceRecords() {
  return useQuery({
    queryKey: ['compliance', 'records'],
    queryFn: api.listComplianceRecords,
  });
}

export function useCreateComplianceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createComplianceRecord,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance'] });
    },
  });
}

export function useUpdateComplianceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<api.CreateComplianceRecordPayload> }) =>
      api.updateComplianceRecord(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance'] });
    },
  });
}

