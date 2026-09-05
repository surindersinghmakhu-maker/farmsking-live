import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPriceLockContract, get30DayPricePredictions, getMyPriceLocks } from '../api/mandi-ai.api';

export function use30DayPricePredictions(cropName: string = 'Wheat', mandiName: string = 'Khanna') {
  return useQuery({
    queryKey: ['mandi-predictions', cropName, mandiName],
    queryFn: () => get30DayPricePredictions(cropName, mandiName),
  });
}

export function useMyPriceLocks() {
  return useQuery({
    queryKey: ['my-price-locks'],
    queryFn: getMyPriceLocks,
  });
}

export function useCreatePriceLock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { cropName: string; quantityQuintal: number; lockedRate: number; buyerId?: string }) =>
      createPriceLockContract(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-price-locks'] });
    },
  });
}
