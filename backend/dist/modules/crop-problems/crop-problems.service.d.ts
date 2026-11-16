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
        assignedAdvisor: {
            id: string;
            mobile: string;
            name: string;
        } | null;
        cropCycle: {
            id: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            cropName: string;
        };
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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        title: string;
        assignedAdvisorId: string | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        description: string;
        reportedById: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        recommendedProduct: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        forwardedToSeniorAt: Date | null;
        forwardedFromJuniorId: string | null;
        resolvedAt: Date | null;
        cropCycleId: string;
    }>;
    findAllForFarmer(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        assignedAdvisor: {
            id: string;
            mobile: string;
            name: string;
        } | null;
        cropCycle: {
            id: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            cropName: string;
        };
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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        title: string;
        assignedAdvisorId: string | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        description: string;
        reportedById: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        recommendedProduct: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        forwardedToSeniorAt: Date | null;
        forwardedFromJuniorId: string | null;
        resolvedAt: Date | null;
        cropCycleId: string;
    })[]>;
    findAllForAdvisor(user: AuthUser): Promise<({
        assignedAdvisor: {
            id: string;
            mobile: string;
            name: string;
        } | null;
        cropCycle: {
            id: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            cropName: string;
        };
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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        title: string;
        assignedAdvisorId: string | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        description: string;
        reportedById: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        recommendedProduct: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        forwardedToSeniorAt: Date | null;
        forwardedFromJuniorId: string | null;
        resolvedAt: Date | null;
        cropCycleId: string;
    })[]>;
    findOneOrThrow(user: AuthUser, id: string): Promise<{
        assignedAdvisor: {
            id: string;
            mobile: string;
            name: string;
        } | null;
        cropCycle: {
            id: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            cropName: string;
        };
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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        title: string;
        assignedAdvisorId: string | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        description: string;
        reportedById: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        recommendedProduct: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        forwardedToSeniorAt: Date | null;
        forwardedFromJuniorId: string | null;
        resolvedAt: Date | null;
        cropCycleId: string;
    }>;
    private pickSprayInsertDate;
    respond(user: AuthUser, id: string, dto: RespondCropProblemDto): Promise<{
        insertedScheduleDate: Date | null;
        assignedAdvisor: {
            id: string;
            mobile: string;
            name: string;
        } | null;
        cropCycle: {
            id: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            cropName: string;
        };
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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        title: string;
        assignedAdvisorId: string | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        description: string;
        reportedById: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        recommendedProduct: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        forwardedToSeniorAt: Date | null;
        forwardedFromJuniorId: string | null;
        resolvedAt: Date | null;
        cropCycleId: string;
    }>;
    updateStatus(user: AuthUser, id: string, dto: UpdateCropProblemStatusDto): Promise<{
        assignedAdvisor: {
            id: string;
            mobile: string;
            name: string;
        } | null;
        cropCycle: {
            id: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            cropName: string;
        };
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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        title: string;
        assignedAdvisorId: string | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        description: string;
        reportedById: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        recommendedProduct: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        forwardedToSeniorAt: Date | null;
        forwardedFromJuniorId: string | null;
        resolvedAt: Date | null;
        cropCycleId: string;
    }>;
    rate(user: AuthUser, id: string, dto: {
        rating: number;
        feedback?: string;
    }): Promise<{
        assignedAdvisor: {
            id: string;
            mobile: string;
            name: string;
        } | null;
        cropCycle: {
            id: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            cropName: string;
        };
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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        title: string;
        assignedAdvisorId: string | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        description: string;
        reportedById: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        recommendedProduct: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        forwardedToSeniorAt: Date | null;
        forwardedFromJuniorId: string | null;
        resolvedAt: Date | null;
        cropCycleId: string;
    }>;
    forwardToSeniorDoctor(user: AuthUser, id: string): Promise<{
        assignedAdvisor: {
            id: string;
            mobile: string;
            name: string;
        } | null;
        cropCycle: {
            id: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            cropName: string;
        };
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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        title: string;
        assignedAdvisorId: string | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        description: string;
        reportedById: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        recommendedProduct: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        forwardedToSeniorAt: Date | null;
        forwardedFromJuniorId: string | null;
        resolvedAt: Date | null;
        cropCycleId: string;
    }>;
}
