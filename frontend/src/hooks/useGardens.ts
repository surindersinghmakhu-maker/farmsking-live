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

export function useAllPlants() {
  return useQuery({
    queryKey: ['all-plants'],
    queryFn: api.listAllPlants,
  });
}

export function useGardenPlants(gardenId: string) {
  return useQuery({
    queryKey: ['garden-plants', gardenId],
    queryFn: () => api.listGardenPlants(gardenId),
    enabled: !!gardenId,
  });
}

export function usePlantDetails(id: string) {
  return useQuery({
    queryKey: ['plant-details', id],
    queryFn: () => api.getPlantDetails(id),
    enabled: !!id,
  });
}

export function useCareTasks(dueToday?: boolean) {
  return useQuery({
    queryKey: ['care-tasks', dueToday],
    queryFn: () => api.listCareTasks(dueToday),
  });
}

export function useAiCreditStatus() {
  return useQuery({
    queryKey: ['ai-credit-status'],
    queryFn: api.getAiCreditStatus,
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
      queryClient.invalidateQueries({ queryKey: ['all-plants'] });
      queryClient.invalidateQueries({ queryKey: ['my-gardens'] });
    },
  });
}

export function useAddStandalonePlant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.CreatePlantPayload) => api.addStandalonePlant(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-plants'] });
      queryClient.invalidateQueries({ queryKey: ['my-gardens'] });
    },
  });
}

export function useAddCareSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.CreatePlantCareSchedulePayload) => api.addCareSchedule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-plants'] });
      queryClient.invalidateQueries({ queryKey: ['my-gardens'] });
    },
  });
}

export function useCompleteCareTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scheduleId: string) => api.completeCareTask(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-plants'] });
      queryClient.invalidateQueries({ queryKey: ['my-gardens'] });
    },
  });
}

export function useLogPlantHealth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.LogPlantHealthPayload) => api.logPlantHealth(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plant-details', variables.plantId] });
      queryClient.invalidateQueries({ queryKey: ['all-plants'] });
    },
  });
}
