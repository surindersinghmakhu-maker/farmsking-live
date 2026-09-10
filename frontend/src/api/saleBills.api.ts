import { apiClient } from './client';

export interface SaleBillItemPayload {
  cropId: string;
  cropName: string;
  unit: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface CreateSaleBillPayload {
  billNo?: string;
  farmerName: string;
  partyId?: string;
  partyName: string;
  partyMobile?: string;
  partyAddress?: string;
  isCash: boolean;
  amountReceivedMode?: string;
  items: SaleBillItemPayload[];
  totalItems: number;
  totalAmount: number;
  amountReceived: number;
  thisSaleBalance: number;
  previousBalance: number;
  netReceivable: number;
  discountAmount?: number;
  deliveryCharge?: number;
  notes?: string;
}

export interface SaleBill extends CreateSaleBillPayload {
  id: string;
  billNo: string;
  createdAt: string;
}

export async function createSaleBill(payload: CreateSaleBillPayload): Promise<SaleBill> {
  const { data } = await apiClient.post<SaleBill>('/sale-bills', payload);
  return data;
}

export async function getSaleBill(id: string): Promise<SaleBill> {
  const { data } = await apiClient.get<SaleBill>(`/sale-bills/${id}`);
  return data;
}

export async function updateSaleBill(id: string, payload: CreateSaleBillPayload): Promise<SaleBill> {
  const { data } = await apiClient.patch<SaleBill>(`/sale-bills/${id}`, payload);
  return data;
}

export async function listSaleBills(): Promise<SaleBill[]> {
  const { data } = await apiClient.get<SaleBill[]>('/sale-bills');
  return Array.isArray(data) ? data : [];
}

export async function getMySaleBillCount(): Promise<{ count: number }> {
  const { data } = await apiClient.get<{ count: number }>('/sale-bills/count/mine');
  return data;
}

export async function deleteSaleBill(id: string): Promise<void> {
  await apiClient.delete(`/sale-bills/${id}`);
}
