import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/products.api';

export function useProducts(includeInactive = false) {
  return useQuery({
    queryKey: ['products', includeInactive],
    queryFn: () => api.listProducts(includeInactive),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useProduct(id?: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => (id ? api.getProduct(id) : Promise.reject('No ID')),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: api.UpdateProductPayload }) => api.updateProduct(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useRemoveProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.removeProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useProductReviews(productId?: string) {
  return useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: () => api.getProductReviews(productId as string),
    enabled: Boolean(productId),
    staleTime: 60 * 1000,
  });
}

export function useSubmitProductReview(productId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { rating: number; title?: string; comment?: string }) =>
      api.submitProductReview(productId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
