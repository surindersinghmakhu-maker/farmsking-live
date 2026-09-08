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
  return useQuery({ queryKey: ['orders', 'fulfillment-queue'], queryFn: api.listFulfillmentQueue, refetchInterval: 10_000 });
}

export function useOrder(id: string | undefined) {
  return useQuery({ queryKey: ['orders', id], queryFn: () => api.getOrder(id as string), enabled: !!id });
}

function useOrderMutation(mutationFn: (id: string) => Promise<unknown>, targetStatus?: OrderStatus) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (data: any, id: string) => {
      // Instantly update query data in cache for instant UI feedback
      queryClient.setQueriesData({ queryKey: ['orders'] }, (oldData: any) => {
        if (!oldData) return oldData;
        if (Array.isArray(oldData)) {
          return oldData.map((order: any) => {
            if (order.id === id) {
              const newStatus = (data as any)?.status || targetStatus || order.status;
              return { ...order, status: newStatus };
            }
            return order;
          });
        }
        return oldData;
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.refetchQueries({ queryKey: ['orders'] });
    },
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
    onSuccess: (newOrder) => {
      queryClient.setQueriesData({ queryKey: ['orders', 'mine'] }, (old: any) => {
        if (Array.isArray(old)) return [newOrder, ...old];
        return [newOrder];
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useConfirmOrder() {
  return useOrderMutation(api.confirmOrder, 'CONFIRMED');
}

export function useCancelOrder() {
  return useOrderMutation(api.cancelOrder, 'CANCELLED');
}

export function useStartPackingOrder() {
  return useOrderMutation(api.startPackingOrder, 'PACKING');
}

export function useMarkOrderPacked() {
  return useOrderMutation(api.markOrderPacked, 'PACKED');
}

export function useMarkOrderDelivered() {
  return useOrderMutation(api.markOrderDelivered, 'DELIVERED');
}

export function useDispatchOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, courierName, trackingId }: { id: string; courierName: string; trackingId?: string }) =>
      api.dispatchOrder(id, courierName, trackingId),
    onSuccess: (data: any, vars: { id: string; courierName: string; trackingId?: string }) => {
      queryClient.setQueriesData({ queryKey: ['orders'] }, (oldData: any) => {
        if (!oldData) return oldData;
        if (Array.isArray(oldData)) {
          return oldData.map((order: any) => {
            if (order.id === vars.id) {
              return { ...order, status: 'DISPATCHED' };
            }
            return order;
          });
        }
        return oldData;
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.refetchQueries({ queryKey: ['orders'] });
    },
  });
}
