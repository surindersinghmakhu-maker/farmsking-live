import { apiClient } from './client';

export interface CustomerAddress {
  id: string;
  ownerId: string;
  tag: 'HOME' | 'FARM' | 'WORK';
  line: string;
  mobile?: string | null;
  postOffice: string;
  district: string;
  state: string;
  pincode: string;
  createdAt: string;
}

export interface CreateAddressPayload {
  tag: 'HOME' | 'FARM' | 'WORK';
  line: string;
  mobile?: string;
  postOffice: string;
  district: string;
  state: string;
  pincode: string;
}

export async function createAddress(payload: CreateAddressPayload): Promise<CustomerAddress> {
  const { data } = await apiClient.post<CustomerAddress>('/addresses', payload);
  return data;
}

export async function listMyAddresses(): Promise<CustomerAddress[]> {
  const { data } = await apiClient.get<CustomerAddress[]>('/addresses/mine');
  return data;
}

export async function updateAddress(
  id: string,
  payload: Partial<CreateAddressPayload>
): Promise<CustomerAddress> {
  const { data } = await apiClient.patch<CustomerAddress>(`/addresses/${id}`, payload);
  return data;
}

export async function deleteAddress(id: string): Promise<void> {
  await apiClient.delete(`/addresses/${id}`);
}
