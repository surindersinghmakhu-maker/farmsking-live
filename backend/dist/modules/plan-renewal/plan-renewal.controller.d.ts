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
        assignedAdvisorId: string | null;
        code: string;
        daysGranted: number;
        assignedFarmerId: string | null;
        isUsed: boolean;
        usedAt: Date | null;
        createdById: string;
        bonusDayApplied: boolean;
    }>;
    listAll(): import(".prisma/client").Prisma.PrismaPromise<({
        assignedFarmer: {
            mobile: string;
            id: string;
            name: string;
        } | null;
        assignedAdvisor: {
            mobile: string;
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        assignedAdvisorId: string | null;
        code: string;
        daysGranted: number;
        assignedFarmerId: string | null;
        isUsed: boolean;
        usedAt: Date | null;
        createdById: string;
        bonusDayApplied: boolean;
    })[]>;
    listMine(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        assignedAdvisorId: string | null;
        code: string;
        daysGranted: number;
        assignedFarmerId: string | null;
        isUsed: boolean;
        usedAt: Date | null;
        createdById: string;
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
            id: string;
            status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
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
        daysAdded: number;
        bonusDayApplied: boolean;
        newEndDate: Date;
        isFirstHire: boolean;
    }>;
    grantDays(dto: GrantPlanDaysDto): Promise<{
        subscription: {
            id: string;
            status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
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
        daysAdded: number;
        newEndDate: Date;
    }>;
}
