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
        assignedAdvisorId: string | null;
        daysGranted: number;
        createdById: string;
        code: string;
        isUsed: boolean;
        usedAt: Date | null;
        assignedFarmerId: string | null;
        bonusDayApplied: boolean;
    }>;
    listAll(): import(".prisma/client").Prisma.PrismaPromise<({
        assignedAdvisor: {
            name: string;
            mobile: string;
            id: string;
        } | null;
        assignedFarmer: {
            name: string;
            mobile: string;
            id: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        assignedAdvisorId: string | null;
        daysGranted: number;
        createdById: string;
        code: string;
        isUsed: boolean;
        usedAt: Date | null;
        assignedFarmerId: string | null;
        bonusDayApplied: boolean;
    })[]>;
    listMineForAdvisor(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        assignedAdvisorId: string | null;
        daysGranted: number;
        createdById: string;
        code: string;
        isUsed: boolean;
        usedAt: Date | null;
        assignedFarmerId: string | null;
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
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            startDate: Date | null;
            endDate: Date | null;
            status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
            notes: string | null;
            farmerId: string;
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
    getUpiLinkForFarmer(user: AuthUser, farmerId?: string): Promise<{
        upiLink: string;
        amount: number;
        farmerKingId: string;
        planName: string;
    }>;
    grantDaysDirectly(farmerId: string, daysGranted: number): Promise<{
        subscription: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            startDate: Date | null;
            endDate: Date | null;
            status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
            notes: string | null;
            farmerId: string;
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
