import type { AuthUser } from '../../common/types/auth-user.type';
import { PartnerAssignmentService } from './partner-assignment.service';
export declare class PartnerAssignmentController {
    private readonly partnerAssignmentService;
    constructor(partnerAssignmentService: PartnerAssignmentService);
    findMyPartner(user: AuthUser): import(".prisma/client").Prisma.Prisma__PartnerAssignmentClient<({
        businessPartner: {
            id: string;
            mobile: string;
            name: string;
            photoUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        businessPartnerId: string;
        status: import(".prisma/client").$Enums.PartnerAssignmentStatus;
        startDate: Date;
        endDate: Date | null;
        customerId: string;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    findMyCustomers(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        customer: {
            id: string;
            mobile: string;
            name: string;
            photoUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        businessPartnerId: string;
        status: import(".prisma/client").$Enums.PartnerAssignmentStatus;
        startDate: Date;
        endDate: Date | null;
        customerId: string;
    })[]>;
}
