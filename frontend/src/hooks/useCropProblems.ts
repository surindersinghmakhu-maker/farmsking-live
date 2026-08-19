import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/cropProblems.api';

export function useMyCropProblems() {
  return useQuery({ queryKey: ['crop-problems', 'mine'], queryFn: api.getMyCropProblems });
}

export function useAssignedCropProblems() {
  return useQuery({ queryKey: ['crop-problems', 'assigned'], queryFn: api.getAssignedCropProblems });
}

export function useCreateCropProblem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createCropProblem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop-problems'] });
    },
  });
}

export function useRespondToCropProblem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: api.RespondCropProblemPayload }) =>
      api.respondToCropProblem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop-problems'] });
    },
  });
}

export function useUpdateCropProblemStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Parameters<typeof api.updateCropProblemStatus>[1] }) =>
      api.updateCropProblemStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop-problems'] });
    },
  });
}
