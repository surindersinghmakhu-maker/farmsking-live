import { OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WalletService } from '../wallet/wallet.service';
import { WhatsAppGroupSyncService } from '../whatsapp/whatsapp-group-sync.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateAdvisorAssignmentDto } from './dto/create-advisor-assignment.dto';
export declare class AdvisorAssignmentService implements OnApplicationBootstrap {
    private readonly prisma;
    private readonly notificationsService;
    private readonly walletService;
    private readonly whatsAppGroupSyncService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, walletService: WalletService, whatsAppGroupSyncService: WhatsAppGroupSyncService);
    onApplicationBootstrap(): Promise<void>;
    reassignAllToSudhir(): Promise<void>;
    private readonly STANDARD_OR_PREMIUM_FARMER_CLAUSE;
    getFarmerStats(user: AuthUser): Promise<{
        total: number;
        active: number;
        inactive: number;
    }>;
    private readonly FARMER_BASIC_SELECT;
    private isAssignmentExpired;
    private notExpiredClause;
    findFarmersByStatus(user: AuthUser, status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'ALL'): import(".prisma/client").Prisma.PrismaPromise<({
        farmer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
            village: string | null;
            district: string | null;
            state: string | null;
            photoUrl: string | null;
            sprayTankSizeL: number | null;
            soilType: import(".prisma/client").$Enums.SoilType | null;
            waterType: import(".prisma/client").$Enums.WaterType | null;
            farmerPlan: {
                endDate: Date | null;
                plan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
                expiredAt: Date | null;
            } | null;
        };
        subscription: ({
            plan: {
                id: string;
                updatedAt: Date;
                name: string;
                createdAt: Date;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                isActive: boolean;
                billingCycle: string;
                planType: import(".prisma/client").$Enums.FarmerPlanType;
                maxFarms: number;
            };
        } & {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            deletedAt: Date | null;
            farmerId: string;
            status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
            startDate: Date | null;
            endDate: Date | null;
            notes: string | null;
            planId: string;
            requestedAt: Date;
            approvedAt: Date | null;
            approvedById: string | null;
            cancelledAt: Date | null;
        }) | null;
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        farmerId: string;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        assignedById: string | null;
        subscriptionId: string | null;
        startDate: Date;
        endDate: Date | null;
        notes: string | null;
    })[]>;
    findMyPendingRequest(user: AuthUser): import(".prisma/client").Prisma.Prisma__AdvisorAssignmentClient<({
        advisor: {
            id: string;
            name: string;
            photoUrl: string | null;
            specialization: string | null;
        };
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        farmerId: string;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        assignedById: string | null;
        subscriptionId: string | null;
        startDate: Date;
        endDate: Date | null;
        notes: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    findFarmerDetail(user: AuthUser, farmerId: string): Promise<{
        farmer: {
            farms: any;
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
            village: string | null;
            district: string | null;
            state: string | null;
            photoUrl: string | null;
            sprayTankSizeL: number | null;
            soilType: import(".prisma/client").$Enums.SoilType | null;
            waterType: import(".prisma/client").$Enums.WaterType | null;
            createdAt: Date;
            deletedAt: Date | null;
            farmerPlan: {
                endDate: Date | null;
                plan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
                expiredAt: Date | null;
            } | null;
        };
        assignment: ({
            subscription: ({
                plan: {
                    id: string;
                    updatedAt: Date;
                    name: string;
                    createdAt: Date;
                    description: string | null;
                    price: import("@prisma/client/runtime/library").Decimal;
                    isActive: boolean;
                    billingCycle: string;
                    planType: import(".prisma/client").$Enums.FarmerPlanType;
                    maxFarms: number;
                };
            } & {
                id: string;
                updatedAt: Date;
                createdAt: Date;
                deletedAt: Date | null;
                farmerId: string;
                status: import(".prisma/client").$Enums.SubscriptionPlanStatus;
                startDate: Date | null;
                endDate: Date | null;
                notes: string | null;
                planId: string;
                requestedAt: Date;
                approvedAt: Date | null;
                approvedById: string | null;
                cancelledAt: Date | null;
            }) | null;
        } & {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            deletedAt: Date | null;
            advisorId: string;
            farmerId: string;
            status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
            assignedById: string | null;
            subscriptionId: string | null;
            startDate: Date;
            endDate: Date | null;
            notes: string | null;
        }) | null;
        isExpired: boolean;
    }>;
    findMyAdvisor(user: AuthUser): import(".prisma/client").Prisma.Prisma__AdvisorAssignmentClient<({
        advisor: {
            id: string;
            mobile: string;
            name: string;
            village: string | null;
            district: string | null;
            state: string | null;
            photoUrl: string | null;
            specialization: string | null;
            bio: string | null;
            yearsExperience: number | null;
        };
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        farmerId: string;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        assignedById: string | null;
        subscriptionId: string | null;
        startDate: Date;
        endDate: Date | null;
        notes: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    listAvailableAdvisors(user: AuthUser): Promise<{
        activeFarmerCount: number;
        id: string;
        name: string;
        village: string | null;
        district: string | null;
        state: string | null;
        photoUrl: string | null;
        specialization: string | null;
        bio: string | null;
        yearsExperience: number | null;
    }[]>;
    assertAdvisorAssignedToFarmer(advisorId: string, farmerId: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        farmerId: string;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        assignedById: string | null;
        subscriptionId: string | null;
        startDate: Date;
        endDate: Date | null;
        notes: string | null;
    }>;
    assertAdvisorAssignedToFarmerAnyExpiry(advisorId: string, farmerId: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        farmerId: string;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        assignedById: string | null;
        subscriptionId: string | null;
        startDate: Date;
        endDate: Date | null;
        notes: string | null;
    }>;
    private pickAdvisorForAssignment;
    private roleToAdvisorType;
    createFromSubscription(subscriptionId: string, farmerId: string): Promise<{
        advisor: {
            id: string;
            mobile: string;
            name: string;
        };
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        farmerId: string;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        assignedById: string | null;
        subscriptionId: string | null;
        startDate: Date;
        endDate: Date | null;
        notes: string | null;
    }>;
    requestSpecificAdvisor(farmerId: string, advisorId: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        farmerId: string;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        assignedById: string | null;
        subscriptionId: string | null;
        startDate: Date;
        endDate: Date | null;
        notes: string | null;
    }>;
    accept(user: AuthUser, id: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        farmerId: string;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        assignedById: string | null;
        subscriptionId: string | null;
        startDate: Date;
        endDate: Date | null;
        notes: string | null;
    }>;
    private payoutAdvisorShareOnAccept;
    reject(user: AuthUser, id: string, reason?: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        farmerId: string;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        assignedById: string | null;
        subscriptionId: string | null;
        startDate: Date;
        endDate: Date | null;
        notes: string | null;
    }>;
    create(user: AuthUser, dto: CreateAdvisorAssignmentDto): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        farmerId: string;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        assignedById: string | null;
        subscriptionId: string | null;
        startDate: Date;
        endDate: Date | null;
        notes: string | null;
    }>;
    findOneOrThrow(user: AuthUser, id: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        farmerId: string;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        assignedById: string | null;
        subscriptionId: string | null;
        startDate: Date;
        endDate: Date | null;
        notes: string | null;
    }>;
    revoke(user: AuthUser, id: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        advisorId: string;
        farmerId: string;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        assignedById: string | null;
        subscriptionId: string | null;
        startDate: Date;
        endDate: Date | null;
        notes: string | null;
    }>;
    sendRenewalReminder(user: AuthUser, farmerId: string): Promise<{
        success: boolean;
    }>;
}
