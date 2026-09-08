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
    requestSpecificAdvisor(user: AuthUser, advisorId: string): Promise<{
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
    reject(user: AuthUser, id: string, dto: RejectAssignmentDto): Promise<{
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
