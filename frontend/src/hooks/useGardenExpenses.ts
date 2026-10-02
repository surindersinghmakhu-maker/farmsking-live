import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '../api/client';

export function useGardenExpenses() {
  return useQuery({
    queryKey: ['garden-expenses'],
    queryFn: async () => {
      const { data } = await api.get('/gardens/expenses');
      return data as any[];
    },
  });
}

export function useAddGardenExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      amount: number;
      category: string;
      note?: string;
      gardenId?: string;
    }) => {
      const { data } = await api.post('/gardens/expenses', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garden-expenses'] });
    },
  });
}

export function useDeleteGardenExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/gardens/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garden-expenses'] });
    },
  });
}
