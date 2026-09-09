import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as saleBillsApi from '../api/saleBills.api';

export function useCreateSaleBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saleBillsApi.createSaleBill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale-bills', 'count', 'mine'] });
    },
  });
}

export function useFetchSaleBill() {
  return useMutation({
    mutationFn: (id: string) => saleBillsApi.getSaleBill(id),
  });
}

export function useUpdateSaleBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: saleBillsApi.CreateSaleBillPayload }) =>
      saleBillsApi.updateSaleBill(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale-bills', 'count', 'mine'] });
    },
  });
}

export function useMySaleBillCount() {
  return useQuery({
    queryKey: ['sale-bills', 'count', 'mine'],
    queryFn: saleBillsApi.getMySaleBillCount,
  });
}

export function useSaleBills() {
  return useQuery({
    queryKey: ['sale-bills', 'mine'],
    queryFn: saleBillsApi.listSaleBills,
  });
}
