import { apiClient } from './client';
import {
  LabourWorker,
  LabourWorkEntry,
  LabourPayment,
  LabourStatement,
  LabourDashboardData,
  PaymentMode,
} from '../types/api';

export interface CreateLabourWorkerPayload {
  name: string;
  mobile?: string;
  address?: string;
  defaultRate?: number;
  defaultUnit?: string;
  notes?: string;
  farmId?: string;
}

export interface UpdateLabourWorkerPayload {
  name?: string;
  mobile?: string;
  address?: string;
  defaultRate?: number;
  defaultUnit?: string;
  notes?: string;
}

export interface CreateWorkEntryPayload {
  workerId: string;
  workDate: string;
  workType: string;
  unit: string;
  quantity: number;
  rate: number;
  notes?: string;
  farmId?: string;
  plotId?: string;
  cropCycleId?: string;
}

export interface CreateLabourPaymentPayload {
  workerId: string;
  paymentDate: string;
  amount: number;
  paymentMode?: PaymentMode;
  notes?: string;
}

export async function getLabourWorkers(): Promise<LabourWorker[]> {
  const { data } = await apiClient.get<LabourWorker[]>('/labour/workers');
  return data;
}

export async function createLabourWorker(payload: CreateLabourWorkerPayload): Promise<LabourWorker> {
  const { data } = await apiClient.post<LabourWorker>('/labour/workers', payload);
  return data;
}

export async function updateLabourWorker(id: string, payload: UpdateLabourWorkerPayload): Promise<LabourWorker> {
  const { data } = await apiClient.put<LabourWorker>(`/labour/workers/${id}`, payload);
  return data;
}

export async function deleteLabourWorker(id: string): Promise<void> {
  await apiClient.delete(`/labour/workers/${id}`);
}

export async function createWorkEntry(payload: CreateWorkEntryPayload): Promise<LabourWorkEntry> {
  const { data } = await apiClient.post<LabourWorkEntry>('/labour/work-entries', payload);
  return data;
}

export async function getWorkEntries(workerId?: string): Promise<LabourWorkEntry[]> {
  const { data } = await apiClient.get<LabourWorkEntry[]>('/labour/work-entries', {
    params: { workerId },
  });
  return data;
}

export async function createLabourPayment(payload: CreateLabourPaymentPayload): Promise<LabourPayment> {
  const { data } = await apiClient.post<LabourPayment>('/labour/payments', payload);
  return data;
}

export async function getLabourPayments(workerId?: string): Promise<LabourPayment[]> {
  const { data } = await apiClient.get<LabourPayment[]>('/labour/payments', {
    params: { workerId },
  });
  return data;
}

export async function getWorkerStatement(workerId: string): Promise<LabourStatement> {
  const { data } = await apiClient.get<LabourStatement>(`/labour/statement/${workerId}`);
  return data;
}

export async function getLabourDashboard(): Promise<LabourDashboardData> {
  const { data } = await apiClient.get<LabourDashboardData>('/labour/my-dashboard');
  return data;
}
