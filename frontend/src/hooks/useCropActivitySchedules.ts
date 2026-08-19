import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/cropActivitySchedules.api';

export function useSchedulesForCropCycle(cropCycleId: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ['crop-activity-schedules', 'crop', cropCycleId],
    queryFn: () => api.getSchedulesForCropCycle(cropCycleId as string),
    enabled: !!cropCycleId && enabled,
  });
}

export function useBulkCreateSchedules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.bulkCreateSchedules,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crop-activity-schedules', 'crop', variables.cropCycleId] });
      queryClient.invalidateQueries({ queryKey: ['crop-activity-schedules', 'advisor'] });
    },
  });
}

export function useCompleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => api.completeSchedule(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop-activity-schedules'] });
    },
  });
}

export function useMyTodaySchedule() {
  return useQuery({ queryKey: ['crop-activity-schedules', 'today'], queryFn: api.getMyTodaySchedule });
}

export function useAdvisorTodaySchedule() {
  return useQuery({ queryKey: ['crop-activity-schedules', 'advisor', 'today'], queryFn: api.getAdvisorTodaySchedule });
}

export function useAdvisorUpcomingSchedule() {
  return useQuery({ queryKey: ['crop-activity-schedules', 'advisor', 'upcoming'], queryFn: api.getAdvisorUpcomingSchedule });
}

export function useAdvisorDelayedSchedule() {
  return useQuery({ queryKey: ['crop-activity-schedules', 'advisor', 'delayed'], queryFn: api.getAdvisorDelayedSchedule });
}

/** Advisor nudges the farmer about a specific task — notification + chat message. */
export function useRemindSchedule() {
  return useMutation({
    mutationFn: (id: string) => api.remindSchedule(id),
  });
}
