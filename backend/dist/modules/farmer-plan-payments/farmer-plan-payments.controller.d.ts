import type { AuthUser } from '../../common/types/auth-user.type';
import { FarmerPlanPaymentsService } from './farmer-plan-payments.service';
import { InitiateFarmerPlanPaymentDto } from './dto/initiate-farmer-plan-payment.dto';
import { SubmitFarmerPlanPaymentDto } from './dto/submit-farmer-plan-payment.dto';
import { RejectFarmerPlanPaymentDto } from './dto/reject-farmer-plan-payment.dto';
export declare class FarmerPlanPaymentsController {
    private readonly farmerPlanPaymentsService;
    constructor(farmerPlanPaymentsService: FarmerPlanPaymentsService);
    initiate(user: AuthUser, dto: InitiateFarmerPlanPaymentDto, farmerId?: string): Promise<{
        cashfreeSessionId: any;
        farmer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
        };
        id: string;
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
        farmerId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        requestedAt: Date;
        daysGranted: number;
        advisorKingId: string | null;
        doctorKingId: string | null;
        rejectionReason: string | null;
        utr: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        confirmedById: string | null;
        rejectedAt: Date | null;
        targetPlan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
        screenshotUrl: string | null;
        selectedDoctorId: string | null;
        selectedAdvisorId: string | null;
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
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
        farmerId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        requestedAt: Date;
        daysGranted: number;
        advisorKingId: string | null;
        doctorKingId: string | null;
        rejectionReason: string | null;
        utr: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        confirmedById: string | null;
        rejectedAt: Date | null;
        targetPlan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
        screenshotUrl: string | null;
        selectedDoctorId: string | null;
        selectedAdvisorId: string | null;
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
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
        farmerId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        requestedAt: Date;
        daysGranted: number;
        advisorKingId: string | null;
        doctorKingId: string | null;
        rejectionReason: string | null;
        utr: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        confirmedById: string | null;
        rejectedAt: Date | null;
        targetPlan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
        screenshotUrl: string | null;
        selectedDoctorId: string | null;
        selectedAdvisorId: string | null;
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
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
        farmerId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        requestedAt: Date;
        daysGranted: number;
        advisorKingId: string | null;
        doctorKingId: string | null;
        rejectionReason: string | null;
        utr: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        confirmedById: string | null;
        rejectedAt: Date | null;
        targetPlan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
        screenshotUrl: string | null;
        selectedDoctorId: string | null;
        selectedAdvisorId: string | null;
    }>;
    confirm(user: AuthUser, id: string): Promise<{
        plan: any;
        daysGranted: number;
        newEndDate: any;
        extended: boolean;
        advisorHired: boolean;
        sleptPlanCreated: boolean;
        request: {
            farmer: {
                id: string;
                kingId: string | null;
                mobile: string;
                name: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.PlanPaymentStatus;
            farmerId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            requestedAt: Date;
            daysGranted: number;
            advisorKingId: string | null;
            doctorKingId: string | null;
            rejectionReason: string | null;
            utr: string | null;
            submittedAt: Date | null;
            confirmedAt: Date | null;
            confirmedById: string | null;
            rejectedAt: Date | null;
            targetPlan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
            screenshotUrl: string | null;
            selectedDoctorId: string | null;
            selectedAdvisorId: string | null;
        };
        coupon: {
            id: string;
            createdAt: Date;
            code: string;
            expiresAt: Date | null;
            createdById: string;
            plan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
            daysGranted: number;
            assignedAdvisorId: string | null;
            category: import(".prisma/client").$Enums.PlanCouponCategory;
            assignedFarmerId: string | null;
            assignedBusinessPartnerId: string | null;
            doctorFeeAmount: import("@prisma/client/runtime/library").Decimal | null;
            includeMembership: boolean;
            includedMembershipPlan: import(".prisma/client").$Enums.FarmerSubscriptionPlan | null;
            includedMembershipDays: number | null;
            advisorKingId: string | null;
            isUsed: boolean;
            usedAt: Date | null;
            usedByFarmerId: string | null;
            generationCostAmount: import("@prisma/client/runtime/library").Decimal | null;
            adminPlatformFeePercent: import("@prisma/client/runtime/library").Decimal | null;
            adminPlatformFeeAmount: import("@prisma/client/runtime/library").Decimal | null;
            createdByRole: import(".prisma/client").$Enums.Role | null;
            payoutAmount: import("@prisma/client/runtime/library").Decimal | null;
            payoutRecipientId: string | null;
            doctorKingId: string | null;
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
        status: import(".prisma/client").$Enums.PlanPaymentStatus;
        farmerId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        requestedAt: Date;
        daysGranted: number;
        advisorKingId: string | null;
        doctorKingId: string | null;
        rejectionReason: string | null;
        utr: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        confirmedById: string | null;
        rejectedAt: Date | null;
        targetPlan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
        screenshotUrl: string | null;
        selectedDoctorId: string | null;
        selectedAdvisorId: string | null;
    }>;
}
