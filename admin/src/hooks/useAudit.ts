import { useQuery } from '@tanstack/react-query';
import { listAuditLogs, ListAuditLogParams } from '../api/audit.api';

export function useAuditLogs(params: ListAuditLogParams) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => listAuditLogs(params),
  });
}
