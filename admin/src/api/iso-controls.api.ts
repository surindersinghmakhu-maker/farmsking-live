import { apiClient } from './client';

export interface IsoModuleControl {
  id: string;
  moduleKey: string;
  moduleName: string;
  isEnabled: boolean;
  maintenanceMessage?: string;
  updatedAt: string;
}

export interface IsoAuditLog {
  id: string;
  action: string;
  moduleKey?: string;
  actorId: string;
  actorName?: string;
  details?: any;
  createdAt: string;
}

export const getIsoModuleControls = async (): Promise<IsoModuleControl[]> => {
  const res = await apiClient.get<IsoModuleControl[]>('/iso-controls');
  return res.data;
};

export const toggleIsoModule = async (
  moduleKey: string,
  isEnabled: boolean,
  maintenanceMessage?: string,
): Promise<IsoModuleControl> => {
  const res = await apiClient.put<IsoModuleControl>(`/iso-controls/${moduleKey}/toggle`, {
    isEnabled,
    maintenanceMessage,
  });
  return res.data;
};

export const getIsoAuditLogs = async (): Promise<IsoAuditLog[]> => {
  const res = await apiClient.get<IsoAuditLog[]>('/iso-controls/audit/logs');
  return res.data;
};
