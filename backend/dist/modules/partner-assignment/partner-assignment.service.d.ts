import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
export declare class PartnerAssignmentService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findMyPartner(user: AuthUser): import(".prisma/client").Prisma.Prisma__PartnerAssignmentClient<({
        businessPartner: {
            id: string;
            name: string;
            mobile: string;
            photoUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        businessPartnerId: string;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.PartnerAssignmentStatus;
        customerId: string;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    findMyCustomers(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        customer: {
            id: string;
            name: string;
            mobile: string;
            photoUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        businessPartnerId: string;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.PartnerAssignmentStatus;
        customerId: string;
    })[]>;
}
