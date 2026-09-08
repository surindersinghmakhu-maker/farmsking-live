import type { AuthUser } from '../../common/types/auth-user.type';
import { PlanPaymentsService } from './plan-payments.service';
import { SubmitPlanPaymentDto } from './dto/submit-plan-payment.dto';
import { RejectPlanPaymentDto } from './dto/reject-plan-payment.dto';
export declare class PlanPaymentsController {
    private readonly planPaymentsService;
    constructor(planPaymentsService: PlanPaymentsService);
    initiate(user: AuthUser, farmerId?: string): Promise<{
        upiLink: string;
        farmer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
        };
        subscription: {
            plan: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                billingCycle: string;
                planType: import(".prisma/client").$Enums.FarmerPlanType;
                maxFarms: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
            farmerId: string;
            startDate: Date | null;
            endDate: Date | null;
            notes: string | null;
            planId: string;
            requestedAt: Date;
            approvedAt: Date | null;
            approvedById: string | null;
            cancelledAt: Date | null;
        };
        id: string;
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
        farmerId: string;
        subscriptionId: string;
        requestedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        daysGranted: number;
        utr: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        confirmedById: string | null;
        rejectedAt: Date | null;
        rejectionReason: string | null;
    }>;
    listMine(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        farmer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
        };
        subscription: {
            plan: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                billingCycle: string;
                planType: import(".prisma/client").$Enums.FarmerPlanType;
                maxFarms: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
            farmerId: string;
            startDate: Date | null;
            endDate: Date | null;
            notes: string | null;
            planId: string;
            requestedAt: Date;
            approvedAt: Date | null;
            approvedById: string | null;
            cancelledAt: Date | null;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
        farmerId: string;
        subscriptionId: string;
        requestedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        daysGranted: number;
        utr: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        confirmedById: string | null;
        rejectedAt: Date | null;
        rejectionReason: string | null;
    })[]>;
    listPending(): import(".prisma/client").Prisma.PrismaPromise<({
        farmer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
        };
        subscription: {
            plan: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                billingCycle: string;
                planType: import(".prisma/client").$Enums.FarmerPlanType;
                maxFarms: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
            farmerId: string;
            startDate: Date | null;
            endDate: Date | null;
            notes: string | null;
            planId: string;
            requestedAt: Date;
            approvedAt: Date | null;
            approvedById: string | null;
            cancelledAt: Date | null;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
        farmerId: string;
        subscriptionId: string;
        requestedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        daysGranted: number;
        utr: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        confirmedById: string | null;
        rejectedAt: Date | null;
        rejectionReason: string | null;
    })[]>;
    submit(user: AuthUser, id: string, dto: SubmitPlanPaymentDto): Promise<{
        farmer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
        };
        subscription: {
            plan: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                billingCycle: string;
                planType: import(".prisma/client").$Enums.FarmerPlanType;
                maxFarms: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
            farmerId: string;
            startDate: Date | null;
            endDate: Date | null;
            notes: string | null;
            planId: string;
            requestedAt: Date;
            approvedAt: Date | null;
            approvedById: string | null;
            cancelledAt: Date | null;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
        farmerId: string;
        subscriptionId: string;
        requestedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        daysGranted: number;
        utr: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        confirmedById: string | null;
        rejectedAt: Date | null;
        rejectionReason: string | null;
    }>;
    confirm(user: AuthUser, id: string): Promise<{
        request: {
            farmer: {
                id: string;
                kingId: string | null;
                mobile: string;
                name: string;
            };
            subscription: {
                plan: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    isActive: boolean;
                    description: string | null;
                    price: import("@prisma/client/runtime/library").Decimal;
                    billingCycle: string;
                    planType: import(".prisma/client").$Enums.FarmerPlanType;
                    maxFarms: number;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
                farmerId: string;
                startDate: Date | null;
                endDate: Date | null;
                notes: string | null;
                planId: string;
                requestedAt: Date;
                approvedAt: Date | null;
                approvedById: string | null;
                cancelledAt: Date | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.PlanPaymentStatus;
            farmerId: string;
            subscriptionId: string;
            requestedAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            daysGranted: number;
            utr: string | null;
            submittedAt: Date | null;
            confirmedAt: Date | null;
            confirmedById: string | null;
            rejectedAt: Date | null;
            rejectionReason: string | null;
        };
        newEndDate: Date;
    }>;
    reject(user: AuthUser, id: string, dto: RejectPlanPaymentDto): Promise<{
        farmer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
        };
        subscription: {
            plan: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                billingCycle: string;
                planType: import(".prisma/client").$Enums.FarmerPlanType;
                maxFarms: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
            farmerId: string;
            startDate: Date | null;
            endDate: Date | null;
            notes: string | null;
            planId: string;
            requestedAt: Date;
            approvedAt: Date | null;
            approvedById: string | null;
            cancelledAt: Date | null;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
        farmerId: string;
        subscriptionId: string;
        requestedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        daysGranted: number;
        utr: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        confirmedById: string | null;
        rejectedAt: Date | null;
        rejectionReason: string | null;
    }>;
}
