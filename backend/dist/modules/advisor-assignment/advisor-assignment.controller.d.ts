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
    requestSpecificAdvisor(user: AuthUser, advisorId: string): Promise<{
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
    reject(user: AuthUser, id: string, dto: RejectAssignmentDto): Promise<{
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
    adminApproveDoctorChange(user: AuthUser, id: string): Promise<{
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
    adminRejectDoctorChange(user: AuthUser, id: string, body: {
        reason?: string;
    }): Promise<{
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
