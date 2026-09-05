import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as expensesApi from '../api/expenses.api';

export function useExpenseCategories() {
  return useQuery({
    queryKey: ['expense-categories'],
    queryFn: expensesApi.listExpenseCategories,
    staleTime: 60 * 60 * 1000,
  });
}

export function useAllExpenseCategoriesForAdmin() {
  return useQuery({
    queryKey: ['expense-categories', 'admin-all'],
    queryFn: expensesApi.listAllExpenseCategoriesForAdmin,
  });
}

export function useCreateAdminExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: expensesApi.createAdminExpenseCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    },
  });
}

export function useUpdateAdminExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { labelEn?: string; labelHi?: string; sortOrder?: number; isActive?: boolean } }) =>
      expensesApi.updateAdminExpenseCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    },
  });
}

export function useDeleteAdminExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: expensesApi.deleteAdminExpenseCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    },
  });
}

export function useExpensesForFarm(farmId: string | undefined) {
  return useQuery({
    queryKey: ['expenses', 'farm', farmId],
    queryFn: () => expensesApi.listExpensesForFarm(farmId as string),
    enabled: !!farmId,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: expensesApi.createExpense,
    onSuccess: (expense) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', 'farm', expense.farmId] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: expensesApi.UpdateExpensePayload }) =>
      expensesApi.updateExpense(id, payload),
    onSuccess: (expense) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', 'farm', expense.farmId] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; farmId: string }) => expensesApi.deleteExpense(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', 'farm', variables.farmId] });
    },
  });
}
