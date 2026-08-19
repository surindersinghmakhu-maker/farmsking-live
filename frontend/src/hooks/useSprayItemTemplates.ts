import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/sprayItemTemplates.api';

export function useMySprayItemTemplates() {
  return useQuery({
    queryKey: ['spray-item-templates', 'mine'],
    queryFn: api.listMySprayItemTemplates,
  });
}

export function useAllSprayItemTemplates() {
  return useQuery({
    queryKey: ['spray-item-templates', 'all'],
    queryFn: api.listAllSprayItemTemplates,
  });
}

export function useSprayItemTemplatesForMyAdvisor(enabled: boolean = true) {
  return useQuery({
    queryKey: ['spray-item-templates', 'for-my-advisor'],
    queryFn: api.listSprayItemTemplatesForMyAdvisor,
    enabled,
  });
}

export function useCreateSprayItemTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createSprayItemTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['spray-item-templates'] }),
  });
}

export function useUpdateSprayItemTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<api.SprayItemTemplatePayload> }) =>
      api.updateSprayItemTemplate(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['spray-item-templates'] }),
  });
}

export function useDeleteSprayItemTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteSprayItemTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['spray-item-templates'] }),
  });
}
