import { apiClient } from './client';
import { Product } from '../types/api';

export interface CreateProductPayload {
  name: string;
  description?: string;
  category?: string;
  unit?: string;
  price: number;
  imageUrl?: string;
  stockQty?: number;
}

export type UpdateProductPayload = Partial<CreateProductPayload> & { isActive?: boolean };

export async function listProducts(includeInactive = false): Promise<Product[]> {
  const { data } = await apiClient.get<Product[]>('/products', { params: includeInactive ? { includeInactive: 'true' } : {} });
  return data;
}

export async function createProduct(payload: CreateProductPayload): Promise<Product> {
  const { data } = await apiClient.post<Product>('/products', payload);
  return data;
}

export async function updateProduct(id: string, payload: UpdateProductPayload): Promise<Product> {
  const { data } = await apiClient.patch<Product>(`/products/${id}`, payload);
  return data;
}

export async function removeProduct(id: string): Promise<Product> {
  const { data } = await apiClient.delete<Product>(`/products/${id}`);
  return data;
}
