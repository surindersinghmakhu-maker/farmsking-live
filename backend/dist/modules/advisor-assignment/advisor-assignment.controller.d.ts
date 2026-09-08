import type { AuthUser } from '../../common/types/auth-user.type';
import { AdvisorAssignmentService } from './advisor-assignment.service';
import { CreateAdvisorAssignmentDto } from './dto/create-advisor-assignment.dto';
import { ListFarmersQueryDto } from './dto/list-farmers-query.dto';
import { RejectAssignmentDto } from './dto/reject-assignment.dto';
export declare class AdvisorAssignmentController {
    private readonly advisorAssignmentService;
    constructor(advisorAssignmentService: AdvisorAssignmentService);
    getFarmerStats(user: AuthUser): Promise<{
        total: number;
        active: number;
        inactive: number;
    }>;
    findFarmers(user: AuthUser, query: ListFarmersQueryDto): import(".prisma/client").Prisma.PrismaPromise<({
        farmer: {
            mobile: string;
            state: string | null;
            id: string;
            kingId: string | null;
            name: string;
            village: string | null;
            district: string | null;
            photoUrl: string | null;
            sprayTankSizeL: number | null;
            soilType: import(".prisma/client").$Enums.SoilType | null;
            waterType: import(".prisma/client").$Enums.WaterType | null;
            farmerPlan: {
                plan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
                endDate: Date | null;
                expiredAt: Date | null;
            } | null;
        };
        subscription: ({
            plan: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                isActive: boolean;
                billingCycle: string;
                planType: import(".prisma/client").$Enums.FarmerPlanType;
                maxFarms: number;
            };
        } & {
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
        }) | null;
    } & {
        id: string;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        farmerId: string;
        startDate: Date;
        endDate: Date | null;
        advisorId: string;
        assignedById: string | null;
        subscriptionId: string | null;
        notes: string | null;
    })[]>;
    findFarmerDetail(user: AuthUser, farmerId: string): Promise<{
        farmer: {
            farms: any;
            mobile: string;
            state: string | null;
            id: string;
            kingId: string | null;
            name: string;
            village: string | null;
            district: string | null;
            photoUrl: string | null;
            sprayTankSizeL: number | null;
            soilType: import(".prisma/client").$Enums.SoilType | null;
            waterType: import(".prisma/client").$Enums.WaterType | null;
            createdAt: Date;
            deletedAt: Date | null;
            farmerPlan: {
                plan: import(".prisma/client").$Enums.FarmerSubscriptionPlan;
                endDate: Date | null;
                expiredAt: Date | null;
            } | null;
        };
        assignment: ({
            subscription: ({
                plan: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    description: string | null;
                    price: import("@prisma/client/runtime/library").Decimal;
                    isActive: boolean;
                    billingCycle: string;
                    planType: import(".prisma/client").$Enums.FarmerPlanType;
                    maxFarms: number;
                };
            } & {
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
            }) | null;
        } & {
            id: string;
            status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            farmerId: string;
            startDate: Date;
            endDate: Date | null;
            advisorId: string;
            assignedById: string | null;
            subscriptionId: string | null;
            notes: string | null;
        }) | null;
        isExpired: boolean;
    }>;
    findMyAdvisor(user: AuthUser): import(".prisma/client").Prisma.Prisma__AdvisorAssignmentClient<({
        advisor: {
            mobile: string;
            state: string | null;
            id: string;
            name: string;
            village: string | null;
            district: string | null;
            photoUrl: string | null;
            specialization: string | null;
            bio: string | null;
            yearsExperience: number | null;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        farmerId: string;
        startDate: Date;
        endDate: Date | null;
        advisorId: string;
        assignedById: string | null;
        subscriptionId: string | null;
        notes: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    findMyPendingRequest(user: AuthUser): import(".prisma/client").Prisma.Prisma__AdvisorAssignmentClient<({
        advisor: {
            id: string;
            name: string;
            photoUrl: string | null;
            specialization: string | null;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        farmerId: string;
        startDate: Date;
        endDate: Date | null;
        advisorId: string;
        assignedById: string | null;
        subscriptionId: string | null;
        notes: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    listAvailableAdvisors(user: AuthUser): Promise<{
        activeFarmerCount: number;
        state: string | null;
        id: string;
        name: string;
        village: string | null;
        district: string | null;
        photoUrl: string | null;
        specialization: string | null;
        bio: string | null;
        yearsExperience: number | null;
    }[]>;
    requestSpecificAdvisor(user: AuthUser, advisorId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        farmerId: string;
        startDate: Date;
        endDate: Date | null;
        advisorId: string;
        assignedById: string | null;
        subscriptionId: string | null;
        notes: string | null;
    }>;
    create(user: AuthUser, dto: CreateAdvisorAssignmentDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        farmerId: string;
        startDate: Date;
        endDate: Date | null;
        advisorId: string;
        assignedById: string | null;
        subscriptionId: string | null;
        notes: string | null;
    }>;
    revoke(user: AuthUser, id: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        farmerId: string;
        startDate: Date;
        endDate: Date | null;
        advisorId: string;
        assignedById: string | null;
        subscriptionId: string | null;
        notes: string | null;
    }>;
    accept(user: AuthUser, id: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        farmerId: string;
        startDate: Date;
        endDate: Date | null;
        advisorId: string;
        assignedById: string | null;
        subscriptionId: string | null;
        notes: string | null;
    }>;
    reject(user: AuthUser, id: string, dto: RejectAssignmentDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        farmerId: string;
        startDate: Date;
        endDate: Date | null;
        advisorId: string;
        assignedById: string | null;
        subscriptionId: string | null;
        notes: string | null;
    }>;
    sendRenewalReminder(user: AuthUser, farmerId: string): Promise<{
        success: boolean;
    }>;
}
