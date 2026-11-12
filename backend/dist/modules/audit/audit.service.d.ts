import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListAuditLogQueryDto } from './dto/list-audit-log-query.dto';
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(filters: ListAuditLogQueryDto): Promise<{
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
            method: string;
            metadata: Prisma.JsonValue | null;
            action: string;
            actorId: string | null;
            actorRole: import(".prisma/client").$Enums.Role | null;
            path: string;
            targetId: string | null;
            statusCode: number;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
}
