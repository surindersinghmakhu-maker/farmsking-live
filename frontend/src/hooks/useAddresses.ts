import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/addresses.api';

export function useMyAddresses() {
  return useQuery({
    queryKey: ['addresses', 'mine'],
    queryFn: api.listMyAddresses,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.CreateAddressPayload) => api.createAddress(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<api.CreateAddressPayload> }) => api.updateAddress(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
}
