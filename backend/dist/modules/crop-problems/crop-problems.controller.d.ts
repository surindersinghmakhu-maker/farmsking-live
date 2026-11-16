import type { AuthUser } from '../../common/types/auth-user.type';
import { CropProblemsService } from './crop-problems.service';
import { CreateCropProblemDto } from './dto/create-crop-problem.dto';
import { RespondCropProblemDto } from './dto/respond-crop-problem.dto';
import { UpdateCropProblemStatusDto } from './dto/update-crop-problem-status.dto';
export declare class CropProblemsController {
    private readonly cropProblemsService;
    constructor(cropProblemsService: CropProblemsService);
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
    findMine(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
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
    findAssigned(user: AuthUser): Promise<({
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
    findOne(user: AuthUser, id: string): Promise<{
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
