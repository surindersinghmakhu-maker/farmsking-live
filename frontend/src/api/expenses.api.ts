import { apiClient } from './client';
import { Expense, ExpenseCategory, PaymentMode } from '../types/api';

export interface CreateExpensePayload {
  farmId: string;
  plotId?: string;
  cropCycleId?: string;
  categoryId: string;
  amount: number;
  expenseDate: string;
  paymentMode?: PaymentMode;
  partyId?: string;
  vendorName?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  receiptPhotoUrl?: string;
  notes?: string;
}

export type UpdateExpensePayload = Partial<Omit<CreateExpensePayload, 'farmId'>>;

export async function listExpenseCategories(): Promise<ExpenseCategory[]> {
  const { data } = await apiClient.get<ExpenseCategory[]>('/expenses/categories');
  return data;
}

export async function listAllExpenseCategoriesForAdmin(): Promise<ExpenseCategory[]> {
  const { data } = await apiClient.get<ExpenseCategory[]>('/expenses/categories/all');
  return data;
}

export async function createAdminExpenseCategory(payload: { key: string; labelEn: string; labelHi?: string; sortOrder?: number }): Promise<ExpenseCategory> {
  const { data } = await apiClient.post<ExpenseCategory>('/expenses/categories', payload);
  return data;
}

export async function updateAdminExpenseCategory(id: string, payload: { labelEn?: string; labelHi?: string; sortOrder?: number; isActive?: boolean }): Promise<ExpenseCategory> {
  const { data } = await apiClient.patch<ExpenseCategory>(`/expenses/categories/${id}`, payload);
  return data;
}

export async function deleteAdminExpenseCategory(id: string): Promise<void> {
  await apiClient.delete(`/expenses/categories/${id}`);
}

export async function listExpensesForFarm(farmId: string): Promise<Expense[]> {
  const { data } = await apiClient.get<Expense[]>(`/expenses/farm/${farmId}`);
  return data;
}

export async function createExpense(payload: CreateExpensePayload): Promise<Expense> {
  const { data } = await apiClient.post<Expense>('/expenses', payload);
  return data;
}

export async function updateExpense(id: string, payload: UpdateExpensePayload): Promise<Expense> {
  const { data } = await apiClient.patch<Expense>(`/expenses/${id}`, payload);
  return data;
}

export async function deleteExpense(id: string): Promise<void> {
  await apiClient.delete(`/expenses/${id}`);
}
