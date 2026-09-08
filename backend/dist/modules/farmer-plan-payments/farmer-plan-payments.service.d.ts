import { PrismaService } from '../prisma/prisma.service';
import { AdvisorAssignmentService } from '../advisor-assignment/advisor-assignment.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { FarmerPlansService } from '../farmer-plans/farmer-plans.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { InitiateFarmerPlanPaymentDto } from './dto/initiate-farmer-plan-payment.dto';
import { SubmitFarmerPlanPaymentDto } from './dto/submit-farmer-plan-payment.dto';
import { RejectFarmerPlanPaymentDto } from './dto/reject-farmer-plan-payment.dto';
export declare class FarmerPlanPaymentsService {
    private readonly prisma;
    private readonly advisorAssignmentService;
    private readonly notificationsService;
    private readonly appSettingsService;
    private readonly farmerPlansService;
    constructor(prisma: PrismaService, advisorAssignmentService: AdvisorAssignmentService, notificationsService: NotificationsService, appSettingsService: AppSettingsService, farmerPlansService: FarmerPlansService);
    initiate(user: AuthUser, dto: InitiateFarmerPlanPaymentDto, farmerId?: string): Promise<{
        upiLink: string;
        farmer: {
            mobile: string;
            id: string;
            kingId: string | null;
            name: string;
        };
        id: string;
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
        farmerId: string;
        requestedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        daysGranted: number;
        utr: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        confirmedById: string | null;
        rejectedAt: Date | null;
        rejectionReason: string | null;
        targetPlan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
        screenshotUrl: string | null;
    }>;
    listMine(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        farmer: {
            mobile: string;
            id: string;
            kingId: string | null;
            name: string;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
        farmerId: string;
        requestedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        daysGranted: number;
        utr: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        confirmedById: string | null;
        rejectedAt: Date | null;
        rejectionReason: string | null;
        targetPlan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
        screenshotUrl: string | null;
    })[]>;
    private findOwnedOrThrow;
    submit(user: AuthUser, id: string, dto: SubmitFarmerPlanPaymentDto): Promise<{
        farmer: {
            mobile: string;
            id: string;
            kingId: string | null;
            name: string;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
        farmerId: string;
        requestedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        daysGranted: number;
        utr: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        confirmedById: string | null;
        rejectedAt: Date | null;
        rejectionReason: string | null;
        targetPlan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
        screenshotUrl: string | null;
    }>;
    listPending(): import(".prisma/client").Prisma.PrismaPromise<({
        farmer: {
            mobile: string;
            id: string;
            kingId: string | null;
            name: string;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
        farmerId: string;
        requestedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        daysGranted: number;
        utr: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        confirmedById: string | null;
        rejectedAt: Date | null;
        rejectionReason: string | null;
        targetPlan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
        screenshotUrl: string | null;
    })[]>;
    confirm(admin: AuthUser, id: string): Promise<{
        plan: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            farmerId: string;
            plan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
            startDate: Date;
            endDate: Date | null;
            expiredAt: Date | null;
            couponId: string | null;
        };
        daysGranted: number;
        newEndDate: Date;
        extended: boolean;
        advisorHired: boolean;
        keptHigherPlan: boolean;
        request: {
            farmer: {
                mobile: string;
                id: string;
                kingId: string | null;
                name: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.PlanPaymentStatus;
            farmerId: string;
            requestedAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            daysGranted: number;
            utr: string | null;
            submittedAt: Date | null;
            confirmedAt: Date | null;
            confirmedById: string | null;
            rejectedAt: Date | null;
            rejectionReason: string | null;
            targetPlan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
            screenshotUrl: string | null;
        };
        coupon: {
            id: string;
            createdAt: Date;
            plan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
            assignedAdvisorId: string | null;
            category: import(".prisma/client").$Enums.PlanCouponCategory;
            code: string;
            daysGranted: number;
            assignedFarmerId: string | null;
            assignedBusinessPartnerId: string | null;
            isUsed: boolean;
            usedAt: Date | null;
            usedByFarmerId: string | null;
            expiresAt: Date | null;
            generationCostAmount: import("@prisma/client/runtime/library").Decimal | null;
            createdById: string;
            createdByRole: import(".prisma/client").$Enums.Role | null;
            payoutAmount: import("@prisma/client/runtime/library").Decimal | null;
            payoutRecipientId: string | null;
        };
    }>;
    reject(admin: AuthUser, id: string, dto: RejectFarmerPlanPaymentDto): Promise<{
        farmer: {
            mobile: string;
            id: string;
            kingId: string | null;
            name: string;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
        farmerId: string;
        requestedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        daysGranted: number;
        utr: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        confirmedById: string | null;
        rejectedAt: Date | null;
        rejectionReason: string | null;
        targetPlan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
        screenshotUrl: string | null;
    }>;
}
