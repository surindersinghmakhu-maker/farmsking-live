import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/orders.api';
import { OrderStatus } from '../types/api';

export function useMyOrders() {
  return useQuery({ queryKey: ['orders', 'mine'], queryFn: api.listMyOrders });
}

export function useAllOrders(status?: OrderStatus) {
  return useQuery({ queryKey: ['orders', 'all', status], queryFn: () => api.listAllOrders(status) });
}

export function useFulfillmentQueue() {
  return useQuery({ queryKey: ['orders', 'fulfillment-queue'], queryFn: api.listFulfillmentQueue, refetchInterval: 20_000 });
}

export function useOrder(id: string | undefined) {
  return useQuery({ queryKey: ['orders', id], queryFn: () => api.getOrder(id as string), enabled: !!id });
}

function useOrderMutation(mutationFn: (id: string) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useOrderUpiLink() {
  return useMutation({ mutationFn: api.getOrderUpiLink });
}

export function useInitiatePhonePePayment() {
  return useMutation({
    mutationFn: ({ id, redirectUrl }: { id: string; redirectUrl: string }) => api.initiatePhonePePayment(id, redirectUrl),
  });
}

export function usePhonePePaymentStatus() {
  return useMutation({ mutationFn: api.getPhonePePaymentStatus });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useConfirmOrder() {
  return useOrderMutation(api.confirmOrder);
}

export function useCancelOrder() {
  return useOrderMutation(api.cancelOrder);
}

export function useStartPackingOrder() {
  return useOrderMutation(api.startPackingOrder);
}

export function useMarkOrderPacked() {
  return useOrderMutation(api.markOrderPacked);
}

export function useMarkOrderDelivered() {
  return useOrderMutation(api.markOrderDelivered);
}

export function useDispatchOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, courierName, trackingId }: { id: string; courierName: string; trackingId?: string }) =>
      api.dispatchOrder(id, courierName, trackingId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
}
