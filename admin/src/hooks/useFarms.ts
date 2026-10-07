import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as farmsApi from '../api/farms.api';

export function useFarms() {
  return useQuery({ queryKey: ['farms'], queryFn: farmsApi.listFarms });
}

export function useFarm(id: string | undefined) {
  return useQuery({
    queryKey: ['farms', id],
    queryFn: () => farmsApi.getFarm(id as string),
    enabled: !!id,
  });
}

export function useCreateFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: farmsApi.createFarm,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farms'] }),
  });
}

export function useUpdateFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: farmsApi.UpdateFarmPayload }) =>
      farmsApi.updateFarm(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      queryClient.invalidateQueries({ queryKey: ['farms', variables.id] });
    },
  });
}

export function useDeleteFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: farmsApi.deleteFarm,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farms'] }),
  });
}
