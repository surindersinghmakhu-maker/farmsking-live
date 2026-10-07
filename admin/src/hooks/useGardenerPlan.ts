import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '../api/client';

export function useMyGardenerPlan() {
  return useQuery({
    queryKey: ['my-gardener-plan'],
    queryFn: async () => {
      const { data } = await api.get('/gardener-plans/my-plan');
      return data;
    },
  });
}

export function useBuyGardenerPlan() {
  return useMutation({
    mutationFn: async (plan: string) => {
      const { data } = await api.post('/gardener-plans/buy', { plan });
      return data;
    },
  });
}

export function useActivateVipTrial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/gardener-plans/trial');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-gardener-plan'] });
    },
  });
}
