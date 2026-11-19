import type { AuthUser } from '../../common/types/auth-user.type';
import { PlanRenewalService } from './plan-renewal.service';
import { CreatePlanRenewalCouponDto } from './dto/create-plan-renewal-coupon.dto';
import { RedeemPlanRenewalCouponDto } from './dto/redeem-plan-renewal-coupon.dto';
import { GrantPlanDaysDto } from './dto/grant-plan-days.dto';
export declare class PlanRenewalController {
    private readonly planRenewalService;
    constructor(planRenewalService: PlanRenewalService);
    create(user: AuthUser, dto: CreatePlanRenewalCouponDto): Promise<{
        id: string;
        createdAt: Date;
        createdById: string;
        code: string;
        daysGranted: number;
        isUsed: boolean;
        usedAt: Date | null;
        assignedFarmerId: string | null;
        assignedAdvisorId: string | null;
        bonusDayApplied: boolean;
    }>;
    listAll(): import(".prisma/client").Prisma.PrismaPromise<({
        assignedFarmer: {
            id: string;
            name: string;
            mobile: string;
        } | null;
        assignedAdvisor: {
            id: string;
            name: string;
            mobile: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        createdById: string;
        code: string;
        daysGranted: number;
        isUsed: boolean;
        usedAt: Date | null;
        assignedFarmerId: string | null;
        assignedAdvisorId: string | null;
        bonusDayApplied: boolean;
    })[]>;
    listMine(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        createdById: string;
        code: string;
        daysGranted: number;
        isUsed: boolean;
        usedAt: Date | null;
        assignedFarmerId: string | null;
        assignedAdvisorId: string | null;
        bonusDayApplied: boolean;
    }[]>;
    getUpiLink(user: AuthUser, farmerId?: string): Promise<{
        upiLink: string;
        amount: number;
        farmerKingId: string;
        planName: string;
    }>;
    preview(user: AuthUser, code: string, farmerId?: string): Promise<{
        daysGranted: number;
        bonusDayApplied: boolean;
        newEndDate: Date;
        isFirstHire: boolean;
    }>;
    redeem(user: AuthUser, code: string, dto: RedeemPlanRenewalCouponDto): Promise<{
        subscription: {
            startDate: Date | null;
            endDate: Date | null;
            id: string;
            updatedAt: Date;
            createdAt: Date;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
            cancelledAt: Date | null;
            requestedAt: Date;
            farmerId: string;
            planId: string;
            approvedAt: Date | null;
            approvedById: string | null;
            notes: string | null;
        };
        daysAdded: number;
        bonusDayApplied: boolean;
        newEndDate: Date;
        isFirstHire: boolean;
    }>;
    grantDays(dto: GrantPlanDaysDto): Promise<{
        subscription: {
            startDate: Date | null;
            endDate: Date | null;
            id: string;
            updatedAt: Date;
            createdAt: Date;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
            cancelledAt: Date | null;
            requestedAt: Date;
            farmerId: string;
            planId: string;
            approvedAt: Date | null;
            approvedById: string | null;
            notes: string | null;
        };
        daysAdded: number;
        newEndDate: Date;
    }>;
}
