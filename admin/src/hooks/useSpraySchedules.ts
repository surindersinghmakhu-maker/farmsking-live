import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as sprayScheduleApi from '../api/spraySchedules.api';

export function useSprayScheduleForCrop(cropCycleId: string | undefined) {
  return useQuery({
    queryKey: ['spray-schedules', 'crop', cropCycleId],
    queryFn: () => sprayScheduleApi.listSprayScheduleForCrop(cropCycleId as string),
    enabled: !!cropCycleId,
  });
}

export function useCreateSprayScheduleItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sprayScheduleApi.createSprayScheduleItem,
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['spray-schedules', 'crop', item.cropCycleId] });
    },
  });
}

export function useUpdateSprayScheduleItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: sprayScheduleApi.UpdateSprayScheduleItemPayload }) =>
      sprayScheduleApi.updateSprayScheduleItem(id, payload),
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['spray-schedules', 'crop', item.cropCycleId] });
    },
  });
}

export function useDeleteSprayScheduleItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; cropCycleId: string }) => sprayScheduleApi.deleteSprayScheduleItem(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spray-schedules', 'crop', variables.cropCycleId] });
    },
  });
}

/** Debounced-by-caller autocomplete search over the shared product catalog. */
export function useSprayProductCatalogSearch(query: string) {
  return useQuery({
    queryKey: ['spray-schedules', 'catalog', query],
    queryFn: () => sprayScheduleApi.searchSprayProductCatalog(query),
  });
}
