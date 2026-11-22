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
        status: import(".prisma/client").$Enums.PartnerAssignmentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startDate: Date;
        endDate: Date | null;
        customerId: string;
        businessPartnerId: string;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    findMyCustomers(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        customer: {
            id: string;
            mobile: string;
            name: string;
            photoUrl: string | null;
        };
    } & {
        status: import(".prisma/client").$Enums.PartnerAssignmentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startDate: Date;
        endDate: Date | null;
        customerId: string;
        businessPartnerId: string;
    })[]>;
}
