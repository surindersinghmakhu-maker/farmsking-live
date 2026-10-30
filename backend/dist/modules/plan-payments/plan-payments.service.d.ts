import { PrismaService } from '../prisma/prisma.service';
import { AdvisorAssignmentService } from '../advisor-assignment/advisor-assignment.service';
import { PlanRenewalService } from '../plan-renewal/plan-renewal.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { SubmitPlanPaymentDto } from './dto/submit-plan-payment.dto';
import { RejectPlanPaymentDto } from './dto/reject-plan-payment.dto';
export declare class PlanPaymentsService {
    private readonly prisma;
    private readonly advisorAssignmentService;
    private readonly planRenewalService;
    private readonly notificationsService;
    private readonly appSettingsService;
    constructor(prisma: PrismaService, advisorAssignmentService: AdvisorAssignmentService, planRenewalService: PlanRenewalService, notificationsService: NotificationsService, appSettingsService: AppSettingsService);
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
        };
        id: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
        requestedAt: Date;
        farmerId: string;
        daysGranted: number;
        rejectionReason: string | null;
        subscriptionId: string;
        utr: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        confirmedById: string | null;
        rejectedAt: Date | null;
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
        };
    } & {
        id: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
        requestedAt: Date;
        farmerId: string;
        daysGranted: number;
        rejectionReason: string | null;
        subscriptionId: string;
        utr: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        confirmedById: string | null;
        rejectedAt: Date | null;
    })[]>;
    private findOwnedOrThrow;
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
        };
    } & {
        id: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
        requestedAt: Date;
        farmerId: string;
        daysGranted: number;
        rejectionReason: string | null;
        subscriptionId: string;
        utr: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        confirmedById: string | null;
        rejectedAt: Date | null;
    }>;
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
        };
    } & {
        id: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
        requestedAt: Date;
        farmerId: string;
        daysGranted: number;
        rejectionReason: string | null;
        subscriptionId: string;
        utr: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        confirmedById: string | null;
        rejectedAt: Date | null;
    })[]>;
    confirm(admin: AuthUser, id: string): Promise<{
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
            };
        } & {
            id: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            status: import(".prisma/client").$Enums.PlanPaymentStatus;
            requestedAt: Date;
            farmerId: string;
            daysGranted: number;
            rejectionReason: string | null;
            subscriptionId: string;
            utr: string | null;
            submittedAt: Date | null;
            confirmedAt: Date | null;
            confirmedById: string | null;
            rejectedAt: Date | null;
        };
        newEndDate: Date;
    }>;
    reject(admin: AuthUser, id: string, dto: RejectPlanPaymentDto): Promise<{
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
        };
    } & {
        id: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
        requestedAt: Date;
        farmerId: string;
        daysGranted: number;
        rejectionReason: string | null;
        subscriptionId: string;
        utr: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        confirmedById: string | null;
        rejectedAt: Date | null;
    }>;
}
