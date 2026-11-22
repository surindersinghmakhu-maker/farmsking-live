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

export function useDiagnosePlantLeaf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { leafPhotoUrl: string; plantId?: string; leafDescription?: string }) =>
      api.diagnosePlantLeaf(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-credit-status'] });
      queryClient.invalidateQueries({ queryKey: ['plant-diagnoses'] });
      if (variables.plantId) {
        queryClient.invalidateQueries({ queryKey: ['plant-details', variables.plantId] });
        queryClient.invalidateQueries({ queryKey: ['all-plants'] });
      }
    },
  });
}

export function usePlantDiagnoses(plantId?: string) {
  return useQuery({
    queryKey: ['plant-diagnoses', plantId],
    queryFn: () => api.listPlantDiagnoses(plantId),
  });
}

// ── Doctor / Advisor Workspace Hooks ──

export function useDoctorGardenDashboard() {
  return useQuery({
    queryKey: ['doctor-garden-dashboard'],
    queryFn: api.fetchDoctorGardenDashboard,
  });
}

export function useGardenerBotanicalProfile(gardenerId?: string | null) {
  return useQuery({
    queryKey: ['gardener-botanical-profile', gardenerId],
    queryFn: () => (gardenerId ? api.fetchGardenerBotanicalProfile(gardenerId) : null),
    enabled: !!gardenerId,
  });
}

export function usePrescribePlantCare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.PrescribePlantCarePayload) => api.prescribePlantCare(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-garden-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['gardener-botanical-profile', variables.gardenerId] });
      queryClient.invalidateQueries({ queryKey: ['care-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-plants'] });
    },
  });
}

export function useRecordDoctorConsultationNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.DoctorConsultationNotePayload) => api.recordDoctorConsultationNote(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gardener-botanical-profile', variables.gardenerId] });
      queryClient.invalidateQueries({ queryKey: ['doctor-garden-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['plant-details', variables.plantId] });
    },
  });
}
