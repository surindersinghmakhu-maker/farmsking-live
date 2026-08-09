import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as plotsApi from '../api/plots.api';

export function usePlotsForFarm(farmId: string | undefined) {
  return useQuery({
    queryKey: ['plots', 'farm', farmId],
    queryFn: () => plotsApi.listPlotsForFarm(farmId as string),
    enabled: !!farmId,
  });
}

export function usePlot(id: string | undefined) {
  return useQuery({
    queryKey: ['plots', id],
    queryFn: () => plotsApi.getPlot(id as string),
    enabled: !!id,
  });
}

export function useCreatePlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plotsApi.createPlot,
    onSuccess: (plot) => {
      queryClient.invalidateQueries({ queryKey: ['plots', 'farm', plot.farmId] });
    },
  });
}

export function useUpdatePlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: plotsApi.UpdatePlotPayload }) =>
      plotsApi.updatePlot(id, payload),
    onSuccess: (plot) => {
      queryClient.invalidateQueries({ queryKey: ['plots', 'farm', plot.farmId] });
      queryClient.invalidateQueries({ queryKey: ['plots', plot.id] });
    },
  });
}

export function useDeletePlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; farmId: string }) => plotsApi.deletePlot(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plots', 'farm', variables.farmId] });
    },
  });
}
