import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/treatmentTemplates.api';

export function useTreatmentTemplates() {
  return useQuery({ queryKey: ['treatment-templates'], queryFn: api.listTreatmentTemplates });
}

export function useCreateTreatmentTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createTreatmentTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['treatment-templates'] }),
  });
}

export function useUpdateTreatmentTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: api.UpdateTreatmentTemplatePayload }) =>
      api.updateTreatmentTemplate(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['treatment-templates'] }),
  });
}

export function useRemoveTreatmentTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.removeTreatmentTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['treatment-templates'] }),
  });
}

export function useAssignTreatmentTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cropCycleId }: { id: string; cropCycleId: string }) => api.assignTreatmentTemplate(id, cropCycleId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crop-activity-schedules', 'crop', variables.cropCycleId] });
    },
  });
}
