import { apiClient } from './client';
import { Role } from '../types/api';

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actor: { id: string; name: string; kingId: string | null; role: Role } | null;
  actorRole: Role | null;
  method: string;
  path: string;
  action: string;
  targetId: string | null;
  statusCode: number;
  metadata: { body?: unknown } | null;
  createdAt: string;
}

export interface ListAuditLogParams {
  actorId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface ListAuditLogResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

export async function listAuditLogs(params: ListAuditLogParams = {}): Promise<ListAuditLogResponse> {
  const { data } = await apiClient.get<ListAuditLogResponse>('/audit-logs', { params });
  return data;
}
