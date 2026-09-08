import { PrismaService } from '../prisma/prisma.service';
import { CropsService } from '../crops/crops.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatService } from '../chat/chat.service';
import { ChatGateway } from '../chat/chat.gateway';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateCropProblemDto } from './dto/create-crop-problem.dto';
import { RespondCropProblemDto } from './dto/respond-crop-problem.dto';
import { UpdateCropProblemStatusDto } from './dto/update-crop-problem-status.dto';
export declare class CropProblemsService {
    private readonly prisma;
    private readonly cropsService;
    private readonly notificationsService;
    private readonly chatService;
    private readonly chatGateway;
    constructor(prisma: PrismaService, cropsService: CropsService, notificationsService: NotificationsService, chatService: ChatService, chatGateway: ChatGateway);
    create(user: AuthUser, dto: CreateCropProblemDto): Promise<{
        cropCycle: {
            id: string;
            cropName: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
        };
        assignedAdvisor: {
            id: string;
            mobile: string;
            name: string;
        } | null;
        reportedBy: {
            id: string;
            mobile: string;
            name: string;
            sprayTankSizeL: number | null;
        };
        photos: {
            id: string;
            photoUrl: string;
            caption: string | null;
            uploadedAt: Date;
            cropProblemId: string;
        }[];
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        title: string;
        description: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        recommendedProduct: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        resolvedAt: Date | null;
        cropCycleId: string;
        reportedById: string;
        assignedAdvisorId: string | null;
    }>;
    findAllForFarmer(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        cropCycle: {
            id: string;
            cropName: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
        };
        assignedAdvisor: {
            id: string;
            mobile: string;
            name: string;
        } | null;
        reportedBy: {
            id: string;
            mobile: string;
            name: string;
            sprayTankSizeL: number | null;
        };
        photos: {
            id: string;
            photoUrl: string;
            caption: string | null;
            uploadedAt: Date;
            cropProblemId: string;
        }[];
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        title: string;
        description: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        recommendedProduct: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        resolvedAt: Date | null;
        cropCycleId: string;
        reportedById: string;
        assignedAdvisorId: string | null;
    })[]>;
    findAllForAdvisor(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        cropCycle: {
            id: string;
            cropName: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
        };
        assignedAdvisor: {
            id: string;
            mobile: string;
            name: string;
        } | null;
        reportedBy: {
            id: string;
            mobile: string;
            name: string;
            sprayTankSizeL: number | null;
        };
        photos: {
            id: string;
            photoUrl: string;
            caption: string | null;
            uploadedAt: Date;
            cropProblemId: string;
        }[];
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        title: string;
        description: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        recommendedProduct: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        resolvedAt: Date | null;
        cropCycleId: string;
        reportedById: string;
        assignedAdvisorId: string | null;
    })[]>;
    findOneOrThrow(user: AuthUser, id: string): Promise<{
        cropCycle: {
            id: string;
            cropName: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
        };
        assignedAdvisor: {
            id: string;
            mobile: string;
            name: string;
        } | null;
        reportedBy: {
            id: string;
            mobile: string;
            name: string;
            sprayTankSizeL: number | null;
        };
        photos: {
            id: string;
            photoUrl: string;
            caption: string | null;
            uploadedAt: Date;
            cropProblemId: string;
        }[];
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        title: string;
        description: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        recommendedProduct: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        resolvedAt: Date | null;
        cropCycleId: string;
        reportedById: string;
        assignedAdvisorId: string | null;
    }>;
    private pickSprayInsertDate;
    respond(user: AuthUser, id: string, dto: RespondCropProblemDto): Promise<{
        insertedScheduleDate: Date | null;
        cropCycle: {
            id: string;
            cropName: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
        };
        assignedAdvisor: {
            id: string;
            mobile: string;
            name: string;
        } | null;
        reportedBy: {
            id: string;
            mobile: string;
            name: string;
            sprayTankSizeL: number | null;
        };
        photos: {
            id: string;
            photoUrl: string;
            caption: string | null;
            uploadedAt: Date;
            cropProblemId: string;
        }[];
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        title: string;
        description: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        recommendedProduct: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        resolvedAt: Date | null;
        cropCycleId: string;
        reportedById: string;
        assignedAdvisorId: string | null;
    }>;
    updateStatus(user: AuthUser, id: string, dto: UpdateCropProblemStatusDto): Promise<{
        cropCycle: {
            id: string;
            cropName: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
        };
        assignedAdvisor: {
            id: string;
            mobile: string;
            name: string;
        } | null;
        reportedBy: {
            id: string;
            mobile: string;
            name: string;
            sprayTankSizeL: number | null;
        };
        photos: {
            id: string;
            photoUrl: string;
            caption: string | null;
            uploadedAt: Date;
            cropProblemId: string;
        }[];
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        title: string;
        description: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        recommendedProduct: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        resolvedAt: Date | null;
        cropCycleId: string;
        reportedById: string;
        assignedAdvisorId: string | null;
    }>;
    rate(user: AuthUser, id: string, dto: {
        rating: number;
        feedback?: string;
    }): Promise<{
        cropCycle: {
            id: string;
            cropName: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
        };
        assignedAdvisor: {
            id: string;
            mobile: string;
            name: string;
        } | null;
        reportedBy: {
            id: string;
            mobile: string;
            name: string;
            sprayTankSizeL: number | null;
        };
        photos: {
            id: string;
            photoUrl: string;
            caption: string | null;
            uploadedAt: Date;
            cropProblemId: string;
        }[];
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        title: string;
        description: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        recommendedProduct: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        resolvedAt: Date | null;
        cropCycleId: string;
        reportedById: string;
        assignedAdvisorId: string | null;
    }>;
}
