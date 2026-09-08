import type { AuthUser } from '../../common/types/auth-user.type';
import { FarmerPlanPaymentsService } from './farmer-plan-payments.service';
import { InitiateFarmerPlanPaymentDto } from './dto/initiate-farmer-plan-payment.dto';
import { SubmitFarmerPlanPaymentDto } from './dto/submit-farmer-plan-payment.dto';
import { RejectFarmerPlanPaymentDto } from './dto/reject-farmer-plan-payment.dto';
export declare class FarmerPlanPaymentsController {
    private readonly farmerPlanPaymentsService;
    constructor(farmerPlanPaymentsService: FarmerPlanPaymentsService);
    initiate(user: AuthUser, dto: InitiateFarmerPlanPaymentDto, farmerId?: string): Promise<{
        upiLink: string;
        farmer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
        };
        id: string;
        farmerId: string;
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
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
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
        };
    } & {
        id: string;
        farmerId: string;
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
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
    listPending(): import(".prisma/client").Prisma.PrismaPromise<({
        farmer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
        };
    } & {
        id: string;
        farmerId: string;
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
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
    submit(user: AuthUser, id: string, dto: SubmitFarmerPlanPaymentDto): Promise<{
        farmer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
        };
    } & {
        id: string;
        farmerId: string;
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
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
    confirm(user: AuthUser, id: string): Promise<{
        plan: {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            farmerId: string;
            startDate: Date;
            endDate: Date | null;
            plan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
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
                id: string;
                kingId: string | null;
                mobile: string;
                name: string;
            };
        } & {
            id: string;
            farmerId: string;
            status: import(".prisma/client").$Enums.PlanPaymentStatus;
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
    reject(user: AuthUser, id: string, dto: RejectFarmerPlanPaymentDto): Promise<{
        farmer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
        };
    } & {
        id: string;
        farmerId: string;
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
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
