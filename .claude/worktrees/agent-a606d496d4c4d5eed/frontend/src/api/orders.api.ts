import { apiClient } from './client';
import { CustomerOrder, OrderStatus } from '../types/api';

export interface CreateOrderPayload {
  items: { productId: string; quantity: number }[];
  deliveryAddress?: string;
  couponCode?: string;
}

export async function createOrder(payload: CreateOrderPayload): Promise<CustomerOrder> {
  const { data } = await apiClient.post<CustomerOrder>('/orders', payload);
  return data;
}

export async function listMyOrders(): Promise<CustomerOrder[]> {
  const { data } = await apiClient.get<CustomerOrder[]>('/orders/mine');
  return data;
}

export async function listAllOrders(status?: OrderStatus): Promise<CustomerOrder[]> {
  const { data } = await apiClient.get<CustomerOrder[]>('/orders', { params: status ? { status } : {} });
  return data;
}

export async function listFulfillmentQueue(): Promise<CustomerOrder[]> {
  const { data } = await apiClient.get<CustomerOrder[]>('/orders/fulfillment-queue');
  return data;
}

export async function getOrder(id: string): Promise<CustomerOrder> {
  const { data } = await apiClient.get<CustomerOrder>(`/orders/${id}`);
  return data;
}

export async function confirmOrder(id: string): Promise<CustomerOrder> {
  const { data } = await apiClient.post<CustomerOrder>(`/orders/${id}/confirm`);
  return data;
}

export async function cancelOrder(id: string): Promise<CustomerOrder> {
  const { data } = await apiClient.post<CustomerOrder>(`/orders/${id}/cancel`);
  return data;
}

export async function startPackingOrder(id: string): Promise<CustomerOrder> {
  const { data } = await apiClient.post<CustomerOrder>(`/orders/${id}/start-packing`);
  return data;
}

export async function markOrderPacked(id: string): Promise<CustomerOrder> {
  const { data } = await apiClient.post<CustomerOrder>(`/orders/${id}/mark-packed`);
  return data;
}

export async function dispatchOrder(id: string, courierName: string, trackingId?: string): Promise<CustomerOrder> {
  const { data } = await apiClient.post<CustomerOrder>(`/orders/${id}/dispatch`, { courierName, trackingId });
  return data;
}

export async function markOrderDelivered(id: string): Promise<CustomerOrder> {
  const { data } = await apiClient.post<CustomerOrder>(`/orders/${id}/mark-delivered`);
  return data;
}
