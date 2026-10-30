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
            farmerPlan: {
                endDate: Date | null;
                plan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
                expiredAt: Date | null;
            } | null;
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
        };
        subscription: ({
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
        }) | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        notes: string | null;
        farmerId: string;
        advisorId: string;
        subscriptionId: string | null;
        assignedById: string | null;
    })[]>;
    findFarmerDetail(user: AuthUser, farmerId: string): Promise<{
        farmer: {
            farms: any;
            farmerPlan: {
                endDate: Date | null;
                plan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
                expiredAt: Date | null;
            } | null;
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
        };
        assignment: ({
            subscription: ({
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
            }) | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            startDate: Date;
            endDate: Date | null;
            status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
            notes: string | null;
            farmerId: string;
            advisorId: string;
            subscriptionId: string | null;
            assignedById: string | null;
        }) | null;
        isExpired: boolean;
    }>;
    private getDoctorRatingStats;
    findMyAdvisor(user: AuthUser): Promise<({
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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        notes: string | null;
        farmerId: string;
        advisorId: string;
        subscriptionId: string | null;
        assignedById: string | null;
    }) | null>;
    listAvailableAdvisors(user: AuthUser): Promise<{
        rating: number | null;
        ratingCount: number;
        ratingLabel: string;
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
        isSeniorDoctor: boolean;
        seniorDoctorId: string | null;
        doctorConsultationFee: import("@prisma/client/runtime/library").Decimal | null;
    }[]>;
    assertAdvisorAssignedToFarmer(advisorId: string, farmerId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        notes: string | null;
        farmerId: string;
        advisorId: string;
        subscriptionId: string | null;
        assignedById: string | null;
    }>;
    assertAdvisorAssignedToFarmerAnyExpiry(advisorId: string, farmerId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        notes: string | null;
        farmerId: string;
        advisorId: string;
        subscriptionId: string | null;
        assignedById: string | null;
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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        notes: string | null;
        farmerId: string;
        advisorId: string;
        subscriptionId: string | null;
        assignedById: string | null;
    }>;
    findMyPendingRequest(user: AuthUser): import(".prisma/client").Prisma.Prisma__AdvisorAssignmentClient<({
        advisor: {
            id: string;
            name: string;
            photoUrl: string | null;
            specialization: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        notes: string | null;
        farmerId: string;
        advisorId: string;
        subscriptionId: string | null;
        assignedById: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    requestSpecificAdvisor(farmerId: string, advisorId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        notes: string | null;
        farmerId: string;
        advisorId: string;
        subscriptionId: string | null;
        assignedById: string | null;
    }>;
    findPendingDoctorChangeRequests(): Promise<({
        farmer: {
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
            district: string | null;
            state: string | null;
        };
        advisor: {
            id: string;
            mobile: string;
            name: string;
            photoUrl: string | null;
            specialization: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        notes: string | null;
        farmerId: string;
        advisorId: string;
        subscriptionId: string | null;
        assignedById: string | null;
    })[]>;
    adminApproveDoctorChange(adminUser: AuthUser, assignmentId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        notes: string | null;
        farmerId: string;
        advisorId: string;
        subscriptionId: string | null;
        assignedById: string | null;
    }>;
    adminRejectDoctorChange(adminUser: AuthUser, assignmentId: string, reason?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        notes: string | null;
        farmerId: string;
        advisorId: string;
        subscriptionId: string | null;
        assignedById: string | null;
    }>;
    cancelMyPendingRequest(user: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        notes: string | null;
        farmerId: string;
        advisorId: string;
        subscriptionId: string | null;
        assignedById: string | null;
    }>;
    accept(user: AuthUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        notes: string | null;
        farmerId: string;
        advisorId: string;
        subscriptionId: string | null;
        assignedById: string | null;
    }>;
    private payoutAdvisorShareOnAccept;
    reject(user: AuthUser, id: string, reason?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        notes: string | null;
        farmerId: string;
        advisorId: string;
        subscriptionId: string | null;
        assignedById: string | null;
    }>;
    create(user: AuthUser, dto: CreateAdvisorAssignmentDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        notes: string | null;
        farmerId: string;
        advisorId: string;
        subscriptionId: string | null;
        assignedById: string | null;
    }>;
    findOneOrThrow(user: AuthUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        notes: string | null;
        farmerId: string;
        advisorId: string;
        subscriptionId: string | null;
        assignedById: string | null;
    }>;
    revoke(user: AuthUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        notes: string | null;
        farmerId: string;
        advisorId: string;
        subscriptionId: string | null;
        assignedById: string | null;
    }>;
    sendRenewalReminder(user: AuthUser, farmerId: string): Promise<{
        success: boolean;
    }>;
}
