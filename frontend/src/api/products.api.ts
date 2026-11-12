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

export async function getProduct(id: string): Promise<Product> {
  const { data } = await apiClient.get<Product>('/products/' + id);
  return data;
}

export async function createProduct(payload: CreateProductPayload): Promise<Product> {
  const { data } = await apiClient.post<Product>('/products', payload);
  return data;
}

export async function updateProduct(id: string, payload: UpdateProductPayload): Promise<Product> {
  const { data } = await apiClient.patch<Product>('/products/' + id, payload);
  return data;
}

export async function removeProduct(id: string): Promise<Product> {
  const { data } = await apiClient.delete<Product>('/products/' + id);
  return data;
}

export interface ProductReviewItem {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  photoUrls?: string[];
  createdAt: string;
  isVerifiedBuyer?: boolean;
  user?: {
    id: string;
    name: string;
  };
}

export interface ProductReviewsResponse {
  reviews: ProductReviewItem[];
  total: number;
  verifiedBuyerCount?: number;
  avgRating: number | null;
}

export async function getProductReviews(productId: string): Promise<ProductReviewsResponse> {
  const { data } = await apiClient.get<ProductReviewsResponse>(`/products/${productId}/reviews`);
  return data;
}

export async function submitProductReview(
  productId: string,
  payload: { rating: number; title?: string; comment?: string; photoUrls?: string[] },
): Promise<ProductReviewItem> {
  const { data } = await apiClient.post<ProductReviewItem>(`/products/${productId}/reviews`, payload);
  return data;
}
