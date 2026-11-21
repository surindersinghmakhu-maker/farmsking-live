import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
export declare class PartnerAssignmentService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
