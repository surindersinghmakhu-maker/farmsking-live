import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/gardens.api';

export function useMyGardens() {
  return useQuery({
    queryKey: ['my-gardens'],
    queryFn: api.listMyGardens,
  });
}

export function useGarden(id: string) {
  return useQuery({
    queryKey: ['garden', id],
    queryFn: () => api.getGarden(id),
    enabled: !!id,
  });
}

export function useGardenPlants(gardenId: string) {
  return useQuery({
    queryKey: ['garden-plants', gardenId],
    queryFn: () => api.listGardenPlants(gardenId),
    enabled: !!gardenId,
  });
}

export function useCreateGarden() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createGarden,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-gardens'] });
    },
  });
}

export function useAddPlant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ gardenId, payload }: { gardenId: string; payload: api.CreatePlantPayload }) =>
      api.addPlant(gardenId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['garden-plants', variables.gardenId] });
    },
  });
}
