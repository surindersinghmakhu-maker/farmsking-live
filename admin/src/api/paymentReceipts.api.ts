import { apiClient } from './client';

export interface PaymentReceipt {
  id: string;
  farmerId: string;
  receiptNo: string;
  partyId: string;
  partyName: string;
  isReceived: boolean;
  previousBalance: number;
  paymentAmount: number;
  netBalance: number;
  createdAt: string;
}

export async function getPaymentReceipt(id: string): Promise<PaymentReceipt> {
  const { data } = await apiClient.get<PaymentReceipt>(`/payment-receipts/${id}`);
  return data;
}

export async function getMyPaymentReceiptCount(): Promise<{ count: number }> {
  const { data } = await apiClient.get<{ count: number }>('/payment-receipts/count/mine');
  return data;
}
