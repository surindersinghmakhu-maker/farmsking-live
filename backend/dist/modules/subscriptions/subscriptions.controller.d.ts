import type { AuthUser } from '../../common/types/auth-user.type';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
export declare class SubscriptionsController {
    private readonly subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    listPlans(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        billingCycle: string;
        hiringModel: import(".prisma/client").$Enums.HiringModelType;
        planType: import(".prisma/client").$Enums.FarmerPlanType;
        maxFarms: number;
    }[]>;
    create(user: AuthUser, dto: CreateSubscriptionDto): Promise<{
        advisorAssignment: {
            advisor: {
                id: string;
                name: string;
                mobile: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            startDate: Date;
            endDate: Date | null;
            status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
            notes: string | null;
            farmerId: string;
            advisorId: string;
            assignedById: string | null;
            subscriptionId: string | null;
        };
        plan: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            isActive: boolean;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            billingCycle: string;
            hiringModel: import(".prisma/client").$Enums.HiringModelType;
            planType: import(".prisma/client").$Enums.FarmerPlanType;
            maxFarms: number;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startDate: Date | null;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
        requestedAt: Date;
        notes: string | null;
        farmerId: string;
        cancelledAt: Date | null;
        planId: string;
        approvedAt: Date | null;
        approvedById: string | null;
    }>;
    findMine(user: AuthUser): import(".prisma/client").Prisma.Prisma__AdvisorSubscriptionClient<({
        advisorAssignment: ({
            advisor: {
                id: string;
                name: string;
                mobile: string;
                village: string | null;
                district: string | null;
                state: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            startDate: Date;
            endDate: Date | null;
            status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
            notes: string | null;
            farmerId: string;
            advisorId: string;
            assignedById: string | null;
            subscriptionId: string | null;
        }) | null;
        plan: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            isActive: boolean;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            billingCycle: string;
            hiringModel: import(".prisma/client").$Enums.HiringModelType;
            planType: import(".prisma/client").$Enums.FarmerPlanType;
            maxFarms: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startDate: Date | null;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
        requestedAt: Date;
        notes: string | null;
        farmerId: string;
        cancelledAt: Date | null;
        planId: string;
        approvedAt: Date | null;
        approvedById: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    cancel(user: AuthUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startDate: Date | null;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
        requestedAt: Date;
        notes: string | null;
        farmerId: string;
        cancelledAt: Date | null;
        planId: string;
        approvedAt: Date | null;
        approvedById: string | null;
    }>;
    approve(user: AuthUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startDate: Date | null;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
        requestedAt: Date;
        notes: string | null;
        farmerId: string;
        cancelledAt: Date | null;
        planId: string;
        approvedAt: Date | null;
        approvedById: string | null;
    }>;
    reject(user: AuthUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startDate: Date | null;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
        requestedAt: Date;
        notes: string | null;
        farmerId: string;
        cancelledAt: Date | null;
        planId: string;
        approvedAt: Date | null;
        approvedById: string | null;
    }>;
}
