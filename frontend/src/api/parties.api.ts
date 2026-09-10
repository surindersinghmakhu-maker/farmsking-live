import { apiClient } from './client';
import { Party, PartyStatement } from '../types/api';

export async function listParties(): Promise<Party[]> {
  const { data } = await apiClient.get<Party[]>('/parties');
  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as any).parties)) return (data as any).parties;
  return [];
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

export interface UpdatePartyPayload {
  name?: string;
  address?: string;
  mobile?: string;
}

export async function updateParty(id: string, payload: UpdatePartyPayload): Promise<Party> {
  const cleanId = ensureUuid(id);
  const { data } = await apiClient.patch<Party>(`/parties/${cleanId}`, payload);
  return data;
}

const ensureUuid = (id: string): string => {
  if (!id) return id;
  if (id.startsWith('labour_')) {
    return id.replace(/^labour_/, '');
  }
  return id;
};

export async function getPartyStatement(id: string): Promise<PartyStatement> {
  const cleanId = ensureUuid(id);
  const { data } = await apiClient.get<PartyStatement>(`/parties/${cleanId}/statement`);
  return data;
}

export interface RecordSaleLedgerPayload {
  totalAmount: number;
  amountReceived?: number;
  reason: string;
  saleBillId?: string;
}

export async function recordSaleLedger(id: string, payload: RecordSaleLedgerPayload): Promise<PartyStatement> {
  const cleanId = ensureUuid(id);
  const { data } = await apiClient.post<PartyStatement>(`/parties/${cleanId}/ledger/sale`, payload);
  return data;
}

export interface RecordPaymentPayload {
  amount: number;
  reason?: string;
}

/** Record a payment RECEIVED from a party — reduces what they owe (receivable). */
export async function recordPaymentReceived(id: string, payload: RecordPaymentPayload): Promise<PartyStatement & { receiptNo: string }> {
  const cleanId = ensureUuid(id);
  const { data } = await apiClient.post<PartyStatement & { receiptNo: string }>(`/parties/${cleanId}/ledger/payment-received`, payload);
  return data;
}

/** Record a payment MADE to a party — reduces what's owed to them (payable). */
export async function recordPaymentMade(id: string, payload: RecordPaymentPayload): Promise<PartyStatement & { receiptNo: string }> {
  const cleanId = ensureUuid(id);
  const { data } = await apiClient.post<PartyStatement & { receiptNo: string }>(`/parties/${cleanId}/ledger/payment-made`, payload);
  return data;
}

export async function clearAllPartyEntries(): Promise<{ message: string; deletedCounts: any }> {
  const { data } = await apiClient.delete('/parties/entries/clear-all');
  return data;
}

export async function clearPartyEntries(id: string): Promise<{ message: string; partyName: string; deletedCounts: any }> {
  const cleanId = ensureUuid(id);
  const { data } = await apiClient.delete(`/parties/${cleanId}/entries`);
  return data;
}

// ─── Unified Party System & Arhtiya Types & APIs ──────────────────────────


export type MandiUnit = 'QUINTAL' | 'BAG_50KG' | 'BAG_35KG' | 'MANN' | 'KG';
export type PartyRole = 'FARMER' | 'CUSTOMER' | 'SUPPLIER' | 'VENDOR' | 'LABOUR' | 'ARHTIYA' | 'BUSINESS_PARTNER' | 'ADVISOR';
export type PartyType = 'INDIVIDUAL' | 'FIRM';

export interface UnifiedParty {
  id: string;
  kingId: string;
  type: PartyType;
  name: string;
  mandiName?: string | null;
  shopNumber?: string | null;
  mobile?: string | null;
  address?: string | null;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  roles: PartyRole[];
  ownerFarmerId?: string | null;
  createdAt: string;
}

export interface CreateUnifiedPartyPayload {
  name: string;
  type?: PartyType;
  roles?: PartyRole[];
  mandiName?: string;
  shopNumber?: string;
  mobile?: string;
  address?: string;
  village?: string;
  district?: string;
  state?: string;
}

export async function createUnifiedParty(payload: CreateUnifiedPartyPayload): Promise<UnifiedParty> {
  const { data } = await apiClient.post<UnifiedParty>('/parties/unified', payload);
  return data;
}

export async function listUnifiedParties(role?: PartyRole): Promise<UnifiedParty[]> {
  const { data } = await apiClient.get<UnifiedParty[]>('/parties/unified', { params: { role } });
  return Array.isArray(data) ? data : [];
}

export interface RecordArhtiyaAdvancePayload {
  partyId: string;
  amount: number;
  transactionDate: string;
  interestRateMonthly?: number;
  notes?: string;
}

export async function recordArhtiyaAdvance(payload: RecordArhtiyaAdvancePayload) {
  const { data } = await apiClient.post('/parties/arhtiya/advance', payload);
  return data;
}

export interface RecordArhtiyaCropSalePayload {
  partyId: string;
  cropName: string;
  cropCycleId?: string;
  inputUnit?: MandiUnit;
  inputQuantity: number;
  ratePerQuintal: number;
  transactionDate: string;
  commissionPercent?: number;
  otherCharges?: number;
  jFormNumber?: string;
  jFormDate?: string;
  jFormPhotoUrl?: string;
  notes?: string;
}

export async function recordArhtiyaCropSale(payload: RecordArhtiyaCropSalePayload) {
  const { data } = await apiClient.post('/parties/arhtiya/crop-sale', payload);
  return data;
}

export interface ArhtiyaHisabResponse {
  party: UnifiedParty;
  totalAdvances: number;
  totalInterestAccrued: number;
  totalDebt: number;
  totalCropSalesNet: number;
  netBalance: number;
  status: 'RECEIVABLE_FROM_ARHTIYA' | 'OWED_TO_ARHTIYA';
  transactions: any[];
}

export async function getArhtiyaLedgerHisab(partyId: string): Promise<ArhtiyaHisabResponse> {
  const { data } = await apiClient.get<ArhtiyaHisabResponse>(`/parties/arhtiya/${partyId}/hisab`);
  return data;
}

