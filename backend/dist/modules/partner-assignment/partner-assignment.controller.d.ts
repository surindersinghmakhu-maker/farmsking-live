import type { AuthUser } from '../../common/types/auth-user.type';
import { PartnerAssignmentService } from './partner-assignment.service';
export declare class PartnerAssignmentController {
    private readonly partnerAssignmentService;
    constructor(partnerAssignmentService: PartnerAssignmentService);
    findMyPartner(user: AuthUser): import(".prisma/client").Prisma.Prisma__PartnerAssignmentClient<({
        businessPartner: {
            name: string;
            mobile: string;
            id: string;
            photoUrl: string | null;
        };
    } & {
        startDate: Date;
        endDate: Date | null;
        customerId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PartnerAssignmentStatus;
        businessPartnerId: string;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    findMyCustomers(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        customer: {
            name: string;
            mobile: string;
            id: string;
            photoUrl: string | null;
        };
    } & {
        startDate: Date;
        endDate: Date | null;
        customerId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PartnerAssignmentStatus;
        businessPartnerId: string;
    })[]>;
}
