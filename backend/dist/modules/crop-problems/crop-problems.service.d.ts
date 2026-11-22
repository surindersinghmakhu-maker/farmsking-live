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
            name: string;
            mobile: string;
        } | null;
        cropCycle: {
            id: string;
            cropName: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
        };
        reportedBy: {
            id: string;
            name: string;
            mobile: string;
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
        status: import(".prisma/client").$Enums.CropProblemStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        assignedAdvisorId: string | null;
        cropCycleId: string;
        title: string;
        recommendedProduct: string | null;
        description: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        forwardedToSeniorAt: Date | null;
        forwardedFromJuniorId: string | null;
        resolvedAt: Date | null;
        reportedById: string;
    }>;
    findAllForFarmer(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        assignedAdvisor: {
            id: string;
            name: string;
            mobile: string;
        } | null;
        cropCycle: {
            id: string;
            cropName: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
        };
        reportedBy: {
            id: string;
            name: string;
            mobile: string;
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
        status: import(".prisma/client").$Enums.CropProblemStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        assignedAdvisorId: string | null;
        cropCycleId: string;
        title: string;
        recommendedProduct: string | null;
        description: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        forwardedToSeniorAt: Date | null;
        forwardedFromJuniorId: string | null;
        resolvedAt: Date | null;
        reportedById: string;
    })[]>;
    findAllForAdvisor(user: AuthUser): Promise<({
        assignedAdvisor: {
            id: string;
            name: string;
            mobile: string;
        } | null;
        cropCycle: {
            id: string;
            cropName: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
        };
        reportedBy: {
            id: string;
            name: string;
            mobile: string;
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
        status: import(".prisma/client").$Enums.CropProblemStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        assignedAdvisorId: string | null;
        cropCycleId: string;
        title: string;
        recommendedProduct: string | null;
        description: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        forwardedToSeniorAt: Date | null;
        forwardedFromJuniorId: string | null;
        resolvedAt: Date | null;
        reportedById: string;
    })[]>;
    findOneOrThrow(user: AuthUser, id: string): Promise<{
        assignedAdvisor: {
            id: string;
            name: string;
            mobile: string;
        } | null;
        cropCycle: {
            id: string;
            cropName: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
        };
        reportedBy: {
            id: string;
            name: string;
            mobile: string;
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
        status: import(".prisma/client").$Enums.CropProblemStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        assignedAdvisorId: string | null;
        cropCycleId: string;
        title: string;
        recommendedProduct: string | null;
        description: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        forwardedToSeniorAt: Date | null;
        forwardedFromJuniorId: string | null;
        resolvedAt: Date | null;
        reportedById: string;
    }>;
    private pickSprayInsertDate;
    respond(user: AuthUser, id: string, dto: RespondCropProblemDto): Promise<{
        insertedScheduleDate: Date | null;
        assignedAdvisor: {
            id: string;
            name: string;
            mobile: string;
        } | null;
        cropCycle: {
            id: string;
            cropName: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
        };
        reportedBy: {
            id: string;
            name: string;
            mobile: string;
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
        status: import(".prisma/client").$Enums.CropProblemStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        assignedAdvisorId: string | null;
        cropCycleId: string;
        title: string;
        recommendedProduct: string | null;
        description: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        forwardedToSeniorAt: Date | null;
        forwardedFromJuniorId: string | null;
        resolvedAt: Date | null;
        reportedById: string;
    }>;
    updateStatus(user: AuthUser, id: string, dto: UpdateCropProblemStatusDto): Promise<{
        assignedAdvisor: {
            id: string;
            name: string;
            mobile: string;
        } | null;
        cropCycle: {
            id: string;
            cropName: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
        };
        reportedBy: {
            id: string;
            name: string;
            mobile: string;
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
        status: import(".prisma/client").$Enums.CropProblemStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        assignedAdvisorId: string | null;
        cropCycleId: string;
        title: string;
        recommendedProduct: string | null;
        description: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        forwardedToSeniorAt: Date | null;
        forwardedFromJuniorId: string | null;
        resolvedAt: Date | null;
        reportedById: string;
    }>;
    rate(user: AuthUser, id: string, dto: {
        rating: number;
        feedback?: string;
    }): Promise<{
        assignedAdvisor: {
            id: string;
            name: string;
            mobile: string;
        } | null;
        cropCycle: {
            id: string;
            cropName: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
        };
        reportedBy: {
            id: string;
            name: string;
            mobile: string;
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
        status: import(".prisma/client").$Enums.CropProblemStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        assignedAdvisorId: string | null;
        cropCycleId: string;
        title: string;
        recommendedProduct: string | null;
        description: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        forwardedToSeniorAt: Date | null;
        forwardedFromJuniorId: string | null;
        resolvedAt: Date | null;
        reportedById: string;
    }>;
    forwardToSeniorDoctor(user: AuthUser, id: string): Promise<{
        assignedAdvisor: {
            id: string;
            name: string;
            mobile: string;
        } | null;
        cropCycle: {
            id: string;
            cropName: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
        };
        reportedBy: {
            id: string;
            name: string;
            mobile: string;
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
        status: import(".prisma/client").$Enums.CropProblemStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        assignedAdvisorId: string | null;
        cropCycleId: string;
        title: string;
        recommendedProduct: string | null;
        description: string;
        severity: import(".prisma/client").$Enums.CropProblemSeverity | null;
        advisorResponse: string | null;
        farmerRating: number | null;
        farmerFeedback: string | null;
        followUpDate: Date | null;
        forwardedToSeniorAt: Date | null;
        forwardedFromJuniorId: string | null;
        resolvedAt: Date | null;
        reportedById: string;
    }>;
}
