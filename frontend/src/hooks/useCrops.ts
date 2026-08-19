import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as cropsApi from '../api/crops.api';

export function useCropsForPlot(plotId: string | undefined) {
  return useQuery({
    queryKey: ['crops', 'plot', plotId],
    queryFn: () => cropsApi.listCropsForPlot(plotId as string),
    enabled: !!plotId,
  });
}

/** Farmer: every real crop cycle they own, across all farms/plots. */
export function useMyCrops() {
  return useQuery({
    queryKey: ['crops', 'mine'],
    queryFn: cropsApi.listMyCrops,
  });
}

export function useCrop(id: string | undefined) {
  return useQuery({
    queryKey: ['crops', id],
    queryFn: () => cropsApi.getCrop(id as string),
    enabled: !!id,
  });
}

/** Admin/Super Admin: resolve a Crop ID (e.g. "CR-482910") to its full record — used to look up a crop before editing it. */
export function useLookupCropByCropId() {
  return useMutation({
    mutationFn: (cropId: string) => cropsApi.lookupCropByCropId(cropId),
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

/** Farmer: send a crop to their assigned advisor for review. */
export function useSubmitCropToAdvisor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cropsApi.submitCropToAdvisor(id),
    onSuccess: (crop) => {
      queryClient.invalidateQueries({ queryKey: ['crops', 'plot', crop.plotId] });
      queryClient.invalidateQueries({ queryKey: ['crops', crop.id] });
      queryClient.invalidateQueries({ queryKey: ['crops', 'mine'] });
    },
  });
}

/** Farmer: cancel their own still-pending crop submission before the advisor responds. */
export function useCancelCropSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cropsApi.cancelCropSubmission(id),
    onSuccess: (crop) => {
      queryClient.invalidateQueries({ queryKey: ['crops', 'plot', crop.plotId] });
      queryClient.invalidateQueries({ queryKey: ['crops', crop.id] });
      queryClient.invalidateQueries({ queryKey: ['crops', 'mine'] });
    },
  });
}

/** Advisor: crops submitted by their assigned farmers, awaiting review. */
export function usePendingCropsForAdvisor() {
  return useQuery({
    queryKey: ['crops', 'advisor', 'pending'],
    queryFn: cropsApi.listPendingCropsForAdvisor,
  });
}

/** Advisor: crops they've already accepted. */
export function useAcceptedCropsForAdvisor() {
  return useQuery({
    queryKey: ['crops', 'advisor', 'accepted'],
    queryFn: cropsApi.listAcceptedCropsForAdvisor,
  });
}

export function useAcceptCropByAdvisor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cropsApi.acceptCropByAdvisor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crops', 'advisor', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['crops', 'advisor', 'accepted'] });
    },
  });
}

export function useRejectCropByAdvisor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => cropsApi.rejectCropByAdvisor(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crops', 'advisor', 'pending'] });
    },
  });
}

/** Advisor: set/update the day-wise advisory schedule text for a crop they've accepted. */
export function useUpdateCropSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assignedSchedule }: { id: string; assignedSchedule: string }) =>
      cropsApi.updateCropSchedule(id, assignedSchedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crops', 'advisor', 'accepted'] });
    },
  });
}
