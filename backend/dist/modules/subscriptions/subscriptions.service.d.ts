import { PrismaService } from '../prisma/prisma.service';
import { AdvisorAssignmentService } from '../advisor-assignment/advisor-assignment.service';
import { WhatsAppGroupSyncService } from '../whatsapp/whatsapp-group-sync.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
export declare class SubscriptionsService {
    private readonly prisma;
    private readonly advisorAssignmentService;
    private readonly whatsAppGroupSyncService;
    constructor(prisma: PrismaService, advisorAssignmentService: AdvisorAssignmentService, whatsAppGroupSyncService: WhatsAppGroupSyncService);
    private upgradePlanForSubscription;
    listPlans(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
        billingCycle: string;
        planType: import(".prisma/client").$Enums.FarmerPlanType;
        maxFarms: number;
    }[]>;
    create(user: AuthUser, dto: CreateSubscriptionDto): Promise<{
        advisorAssignment: {
            advisor: {
                id: string;
                mobile: string;
                name: string;
            };
        } & {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            deletedAt: Date | null;
            advisorId: string;
            farmerId: string;
            status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
            assignedById: string | null;
            subscriptionId: string | null;
            startDate: Date;
            endDate: Date | null;
            notes: string | null;
        };
        plan: {
            id: string;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            isActive: boolean;
            billingCycle: string;
            planType: import(".prisma/client").$Enums.FarmerPlanType;
            maxFarms: number;
        };
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        farmerId: string;
        status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
        startDate: Date | null;
        endDate: Date | null;
        notes: string | null;
        planId: string;
        requestedAt: Date;
        approvedAt: Date | null;
        approvedById: string | null;
        cancelledAt: Date | null;
    }>;
    findMine(user: AuthUser): import(".prisma/client").Prisma.Prisma__AdvisorSubscriptionClient<({
        advisorAssignment: ({
            advisor: {
                id: string;
                mobile: string;
                name: string;
                village: string | null;
                district: string | null;
                state: string | null;
            };
        } & {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            deletedAt: Date | null;
            advisorId: string;
            farmerId: string;
            status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
            assignedById: string | null;
            subscriptionId: string | null;
            startDate: Date;
            endDate: Date | null;
            notes: string | null;
        }) | null;
        plan: {
            id: string;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            isActive: boolean;
            billingCycle: string;
            planType: import(".prisma/client").$Enums.FarmerPlanType;
            maxFarms: number;
        };
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        farmerId: string;
        status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
        startDate: Date | null;
        endDate: Date | null;
        notes: string | null;
        planId: string;
        requestedAt: Date;
        approvedAt: Date | null;
        approvedById: string | null;
        cancelledAt: Date | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    findOneOrThrow(user: AuthUser, id: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        farmerId: string;
        status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
        startDate: Date | null;
        endDate: Date | null;
        notes: string | null;
        planId: string;
        requestedAt: Date;
        approvedAt: Date | null;
        approvedById: string | null;
        cancelledAt: Date | null;
    }>;
    approve(user: AuthUser, id: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        farmerId: string;
        status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
        startDate: Date | null;
        endDate: Date | null;
        notes: string | null;
        planId: string;
        requestedAt: Date;
        approvedAt: Date | null;
        approvedById: string | null;
        cancelledAt: Date | null;
    }>;
    reject(user: AuthUser, id: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        farmerId: string;
        status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
        startDate: Date | null;
        endDate: Date | null;
        notes: string | null;
        planId: string;
        requestedAt: Date;
        approvedAt: Date | null;
        approvedById: string | null;
        cancelledAt: Date | null;
    }>;
    cancel(user: AuthUser, id: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        farmerId: string;
        status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
        startDate: Date | null;
        endDate: Date | null;
        notes: string | null;
        planId: string;
        requestedAt: Date;
        approvedAt: Date | null;
        approvedById: string | null;
        cancelledAt: Date | null;
    }>;
}
