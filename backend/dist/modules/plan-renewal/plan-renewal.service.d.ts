import { PrismaService } from '../prisma/prisma.service';
import { AdvisorAssignmentService } from '../advisor-assignment/advisor-assignment.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { CreatePlanRenewalCouponDto } from './dto/create-plan-renewal-coupon.dto';
import { RedeemPlanRenewalCouponDto } from './dto/redeem-plan-renewal-coupon.dto';
export declare class PlanRenewalService {
    private readonly prisma;
    private readonly advisorAssignmentService;
    private readonly appSettingsService;
    constructor(prisma: PrismaService, advisorAssignmentService: AdvisorAssignmentService, appSettingsService: AppSettingsService);
    create(admin: AuthUser, dto: CreatePlanRenewalCouponDto): Promise<{
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
    listMineForAdvisor(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<{
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
    private resolveCouponAndFarmer;
    previewRedeem(user: AuthUser, code: string, farmerId?: string): Promise<{
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
    getUpiLinkForFarmer(user: AuthUser, farmerId?: string): Promise<{
        upiLink: string;
        amount: number;
        farmerKingId: string;
        planName: string;
    }>;
    grantDaysDirectly(farmerId: string, daysGranted: number): Promise<{
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
