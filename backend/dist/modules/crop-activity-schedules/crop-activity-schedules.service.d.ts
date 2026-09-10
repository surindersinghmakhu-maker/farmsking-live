import { PrismaService } from '../prisma/prisma.service';
import { CropsService } from '../crops/crops.service';
import { AdvisorAssignmentService } from '../advisor-assignment/advisor-assignment.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatService } from '../chat/chat.service';
import { ChatGateway } from '../chat/chat.gateway';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateActivityScheduleDto } from './dto/create-activity-schedule.dto';
import { UpdateActivityScheduleDto } from './dto/update-activity-schedule.dto';
import { BulkCreateActivityScheduleDto } from './dto/bulk-create-activity-schedule.dto';
import { CompleteActivityDto } from './dto/complete-activity.dto';
export declare class CropActivitySchedulesService {
    private readonly prisma;
    private readonly cropsService;
    private readonly advisorAssignmentService;
    private readonly notificationsService;
    private readonly chatService;
    private readonly chatGateway;
    constructor(prisma: PrismaService, cropsService: CropsService, advisorAssignmentService: AdvisorAssignmentService, notificationsService: NotificationsService, chatService: ChatService, chatGateway: ChatGateway);
    private assertCropCycleNotLocked;
    private assertAdvisorAssignedToCropCycle;
    create(user: AuthUser, dto: CreateActivityScheduleDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ActivityStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        cropCycleId: string;
        title: string;
        scheduledDate: Date;
        createdByAdvisorId: string;
        activityType: import(".prisma/client").$Enums.ActivityType;
        description: string | null;
        completedAt: Date | null;
        completedById: string | null;
    }>;
    bulkCreate(user: AuthUser, dto: BulkCreateActivityScheduleDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ActivityStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        cropCycleId: string;
        title: string;
        scheduledDate: Date;
        createdByAdvisorId: string;
        activityType: import(".prisma/client").$Enums.ActivityType;
        description: string | null;
        completedAt: Date | null;
        completedById: string | null;
    }[]>;
    findAllForCropCycle(user: AuthUser, cropCycleId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ActivityStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        cropCycleId: string;
        title: string;
        scheduledDate: Date;
        createdByAdvisorId: string;
        activityType: import(".prisma/client").$Enums.ActivityType;
        description: string | null;
        completedAt: Date | null;
        completedById: string | null;
    }[]>;
    findTodayForFarmer(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        cropCycle: {
            id: string;
            cropName: string;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ActivityStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        cropCycleId: string;
        title: string;
        scheduledDate: Date;
        createdByAdvisorId: string;
        activityType: import(".prisma/client").$Enums.ActivityType;
        description: string | null;
        completedAt: Date | null;
        completedById: string | null;
    })[]>;
    private readonly ADVISOR_SCHEDULE_INCLUDE;
    private advisorScopedWhere;
    findTodayForAdvisor(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        cropCycle: {
            id: string;
            cropName: string;
            plot: {
                id: string;
                name: string;
                farm: {
                    id: string;
                    name: string;
                    owner: {
                        id: string;
                        name: string;
                        mobile: string;
                    };
                };
            };
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ActivityStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        cropCycleId: string;
        title: string;
        scheduledDate: Date;
        createdByAdvisorId: string;
        activityType: import(".prisma/client").$Enums.ActivityType;
        description: string | null;
        completedAt: Date | null;
        completedById: string | null;
    })[]>;
    findUpcomingForAdvisor(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        cropCycle: {
            id: string;
            cropName: string;
            plot: {
                id: string;
                name: string;
                farm: {
                    id: string;
                    name: string;
                    owner: {
                        id: string;
                        name: string;
                        mobile: string;
                    };
                };
            };
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ActivityStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        cropCycleId: string;
        title: string;
        scheduledDate: Date;
        createdByAdvisorId: string;
        activityType: import(".prisma/client").$Enums.ActivityType;
        description: string | null;
        completedAt: Date | null;
        completedById: string | null;
    })[]>;
    findDelayedForAdvisor(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        cropCycle: {
            id: string;
            cropName: string;
            plot: {
                id: string;
                name: string;
                farm: {
                    id: string;
                    name: string;
                    owner: {
                        id: string;
                        name: string;
                        mobile: string;
                    };
                };
            };
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ActivityStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        cropCycleId: string;
        title: string;
        scheduledDate: Date;
        createdByAdvisorId: string;
        activityType: import(".prisma/client").$Enums.ActivityType;
        description: string | null;
        completedAt: Date | null;
        completedById: string | null;
    })[]>;
    private findOneOrThrow;
    remind(user: AuthUser, id: string): Promise<{
        success: boolean;
    }>;
    update(user: AuthUser, id: string, dto: UpdateActivityScheduleDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ActivityStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        cropCycleId: string;
        title: string;
        scheduledDate: Date;
        createdByAdvisorId: string;
        activityType: import(".prisma/client").$Enums.ActivityType;
        description: string | null;
        completedAt: Date | null;
        completedById: string | null;
    }>;
    complete(user: AuthUser, id: string, dto: CompleteActivityDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ActivityStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        cropCycleId: string;
        title: string;
        scheduledDate: Date;
        createdByAdvisorId: string;
        activityType: import(".prisma/client").$Enums.ActivityType;
        description: string | null;
        completedAt: Date | null;
        completedById: string | null;
    }>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ActivityStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        cropCycleId: string;
        title: string;
        scheduledDate: Date;
        createdByAdvisorId: string;
        activityType: import(".prisma/client").$Enums.ActivityType;
        description: string | null;
        completedAt: Date | null;
        completedById: string | null;
    }>;
}
