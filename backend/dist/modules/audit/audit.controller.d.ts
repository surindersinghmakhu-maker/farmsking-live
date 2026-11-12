import { AuditService } from './audit.service';
import { ListAuditLogQueryDto } from './dto/list-audit-log-query.dto';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    list(query: ListAuditLogQueryDto): Promise<{
        items: ({
            actor: {
                id: string;
                kingId: string | null;
                role: import(".prisma/client").$Enums.Role;
                name: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            actorRole: import(".prisma/client").$Enums.Role | null;
            method: string;
            path: string;
            action: string;
            targetId: string | null;
            statusCode: number;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            actorId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
}
