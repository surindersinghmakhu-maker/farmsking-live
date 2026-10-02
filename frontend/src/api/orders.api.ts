import { apiClient } from './client';
import { CustomerOrder, OrderStatus } from '../types/api';

export interface CreateOrderPayload {
  items: { productId: string; quantity: number }[];
  deliveryAddress?: string;
  couponCode?: string;
  paymentMode?: 'COD' | 'ONLINE';
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

export interface OrderUpiLink {
  upiLink: string;
  amount: number;
  orderNumber: string;
}

export async function getOrderUpiLink(id: string): Promise<OrderUpiLink> {
  const { data } = await apiClient.get<OrderUpiLink>(`/orders/${id}/upi-link`);
  return data;
}

export interface CashfreeInitiateResult {
  paymentSessionId: string;
  orderId: string;
}

/** Starts a Cashfree Checkout session. The caller should redirect the user to Cashfree web checkout. */
export async function initiateCashfreePayment(id: string): Promise<CashfreeInitiateResult> {
  const { data } = await apiClient.post<CashfreeInitiateResult>(`/orders/${id}/cashfree/initiate`);
  return data;
}

export interface CashfreePaymentStatus {
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED';
}

export async function getCashfreePaymentStatus(id: string): Promise<CashfreePaymentStatus> {
  const { data } = await apiClient.get<CashfreePaymentStatus>(`/orders/${id}/cashfree/status`);
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
