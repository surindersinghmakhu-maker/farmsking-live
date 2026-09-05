import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as labourApi from '../api/labour.api';

export function useLabourWorkers() {
  return useQuery({
    queryKey: ['labour-workers'],
    queryFn: labourApi.getLabourWorkers,
  });
}

export function useCreateLabourWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: labourApi.createLabourWorker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labour-workers'] });
    },
  });
}

export function useUpdateLabourWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: labourApi.UpdateLabourWorkerPayload }) =>
      labourApi.updateLabourWorker(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['labour-workers'] });
      queryClient.invalidateQueries({ queryKey: ['labour-worker-statement', variables.id] });
    },
  });
}

export function useDeleteLabourWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: labourApi.deleteLabourWorker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labour-workers'] });
    },
  });
}

export function useCreateWorkEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: labourApi.createWorkEntry,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['labour-workers'] });
      queryClient.invalidateQueries({ queryKey: ['labour-work-entries'] });
      queryClient.invalidateQueries({ queryKey: ['labour-worker-statement', variables.workerId] });
    },
  });
}

export function useLabourWorkEntries(workerId?: string) {
  return useQuery({
    queryKey: ['labour-work-entries', workerId],
    queryFn: () => labourApi.getWorkEntries(workerId),
  });
}

export function useCreateLabourPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: labourApi.createLabourPayment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['labour-workers'] });
      queryClient.invalidateQueries({ queryKey: ['labour-payments'] });
      queryClient.invalidateQueries({ queryKey: ['labour-worker-statement', variables.workerId] });
    },
  });
}

export function useLabourPayments(workerId?: string) {
  return useQuery({
    queryKey: ['labour-payments', workerId],
    queryFn: () => labourApi.getLabourPayments(workerId),
  });
}

export function useLabourWorkerStatement(workerId: string | undefined) {
  return useQuery({
    queryKey: ['labour-worker-statement', workerId],
    queryFn: () => labourApi.getWorkerStatement(workerId as string),
    enabled: !!workerId,
  });
}

export function useLabourDashboard() {
  return useQuery({
    queryKey: ['labour-dashboard'],
    queryFn: labourApi.getLabourDashboard,
  });
}
