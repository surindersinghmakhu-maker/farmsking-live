import type { AuthUser } from '../../common/types/auth-user.type';
import { CropActivitySchedulesService } from './crop-activity-schedules.service';
import { CreateActivityScheduleDto } from './dto/create-activity-schedule.dto';
import { UpdateActivityScheduleDto } from './dto/update-activity-schedule.dto';
import { BulkCreateActivityScheduleDto } from './dto/bulk-create-activity-schedule.dto';
import { CompleteActivityDto } from './dto/complete-activity.dto';
export declare class CropActivitySchedulesController {
    private readonly cropActivitySchedulesService;
    constructor(cropActivitySchedulesService: CropActivitySchedulesService);
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
    findToday(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
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
    remind(user: AuthUser, id: string): Promise<{
        success: boolean;
    }>;
}
