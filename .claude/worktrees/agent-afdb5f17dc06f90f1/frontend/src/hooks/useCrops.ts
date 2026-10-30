import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as cropsApi from '../api/crops.api';

export function useCropsForPlot(plotId: string | undefined) {
  return useQuery({
    queryKey: ['crops', 'plot', plotId],
    queryFn: () => cropsApi.listCropsForPlot(plotId as string),
    enabled: !!plotId,
  });
}

export function useCrop(id: string | undefined) {
  return useQuery({
    queryKey: ['crops', id],
    queryFn: () => cropsApi.getCrop(id as string),
    enabled: !!id,
  });
}

export function useCreateCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cropsApi.createCrop,
    onSuccess: (crop) => {
      queryClient.invalidateQueries({ queryKey: ['crops', 'plot', crop.plotId] });
    },
  });
}

export function useUpdateCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: cropsApi.UpdateCropPayload }) =>
      cropsApi.updateCrop(id, payload),
    onSuccess: (crop) => {
      queryClient.invalidateQueries({ queryKey: ['crops', 'plot', crop.plotId] });
      queryClient.invalidateQueries({ queryKey: ['crops', crop.id] });
    },
  });
}

export function useDeleteCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; plotId: string }) => cropsApi.deleteCrop(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crops', 'plot', variables.plotId] });
    },
  });
}
