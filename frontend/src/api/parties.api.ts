import { apiClient } from './client';
import { Party, PartyStatement } from '../types/api';

export async function listParties(): Promise<Party[]> {
  const { data } = await apiClient.get<Party[]>('/parties');
  return data;
}

export interface CreatePartyPayload {
  name: string;
  address: string;
  mobile?: string;
}

export async function createParty(payload: CreatePartyPayload): Promise<Party> {
  const { data } = await apiClient.post<Party>('/parties', payload);
  return data;
}

export async function getPartyStatement(id: string): Promise<PartyStatement> {
  const { data } = await apiClient.get<PartyStatement>(`/parties/${id}/statement`);
  return data;
}

export interface RecordSaleLedgerPayload {
  totalAmount: number;
  amountReceived?: number;
  reason: string;
  saleBillId?: string;
}

export async function recordSaleLedger(id: string, payload: RecordSaleLedgerPayload): Promise<PartyStatement> {
  const { data } = await apiClient.post<PartyStatement>(`/parties/${id}/ledger/sale`, payload);
  return data;
}

export interface RecordPaymentPayload {
  amount: number;
  reason?: string;
}

/** Record a payment RECEIVED from a party — reduces what they owe (receivable). */
export async function recordPaymentReceived(id: string, payload: RecordPaymentPayload): Promise<PartyStatement & { receiptNo: string }> {
  const { data } = await apiClient.post<PartyStatement & { receiptNo: string }>(`/parties/${id}/ledger/payment-received`, payload);
  return data;
}

/** Record a payment MADE to a party — reduces what's owed to them (payable). */
export async function recordPaymentMade(id: string, payload: RecordPaymentPayload): Promise<PartyStatement & { receiptNo: string }> {
  const { data } = await apiClient.post<PartyStatement & { receiptNo: string }>(`/parties/${id}/ledger/payment-made`, payload);
  return data;
}
