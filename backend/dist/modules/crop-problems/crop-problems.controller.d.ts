import type { AuthUser } from '../../common/types/auth-user.type';
import { CropProblemsService } from './crop-problems.service';
import { CreateCropProblemDto } from './dto/create-crop-problem.dto';
import { RespondCropProblemDto } from './dto/respond-crop-problem.dto';
import { UpdateCropProblemStatusDto } from './dto/update-crop-problem-status.dto';
export declare class CropProblemsController {
    private readonly cropProblemsService;
    constructor(cropProblemsService: CropProblemsService);
    create(user: AuthUser, dto: CreateCropProblemDto): Promise<{
        cropCycle: {
            id: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            cropName: string;
        };
        assignedAdvisor: {
            id: string;
            name: string;
            mobile: string;
        } | null;
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
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        title: string;
        description: string;
        assignedAdvisorId: string | null;
        cropCycleId: string;
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
    }>;
    findMine(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        cropCycle: {
            id: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            cropName: string;
        };
        assignedAdvisor: {
            id: string;
            name: string;
            mobile: string;
        } | null;
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
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        title: string;
        description: string;
        assignedAdvisorId: string | null;
        cropCycleId: string;
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
    })[]>;
    findAssigned(user: AuthUser): Promise<({
        cropCycle: {
            id: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            cropName: string;
        };
        assignedAdvisor: {
            id: string;
            name: string;
            mobile: string;
        } | null;
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
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        title: string;
        description: string;
        assignedAdvisorId: string | null;
        cropCycleId: string;
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
    })[]>;
    findOne(user: AuthUser, id: string): Promise<{
        cropCycle: {
            id: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            cropName: string;
        };
        assignedAdvisor: {
            id: string;
            name: string;
            mobile: string;
        } | null;
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
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        title: string;
        description: string;
        assignedAdvisorId: string | null;
        cropCycleId: string;
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
    }>;
    respond(user: AuthUser, id: string, dto: RespondCropProblemDto): Promise<{
        insertedScheduleDate: Date | null;
        cropCycle: {
            id: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            cropName: string;
        };
        assignedAdvisor: {
            id: string;
            name: string;
            mobile: string;
        } | null;
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
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        title: string;
        description: string;
        assignedAdvisorId: string | null;
        cropCycleId: string;
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
    }>;
    updateStatus(user: AuthUser, id: string, dto: UpdateCropProblemStatusDto): Promise<{
        cropCycle: {
            id: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            cropName: string;
        };
        assignedAdvisor: {
            id: string;
            name: string;
            mobile: string;
        } | null;
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
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        title: string;
        description: string;
        assignedAdvisorId: string | null;
        cropCycleId: string;
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
    }>;
    rate(user: AuthUser, id: string, dto: {
        rating: number;
        feedback?: string;
    }): Promise<{
        cropCycle: {
            id: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            cropName: string;
        };
        assignedAdvisor: {
            id: string;
            name: string;
            mobile: string;
        } | null;
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
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        title: string;
        description: string;
        assignedAdvisorId: string | null;
        cropCycleId: string;
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
    }>;
    forwardToSeniorDoctor(user: AuthUser, id: string): Promise<{
        cropCycle: {
            id: string;
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            cropName: string;
        };
        assignedAdvisor: {
            id: string;
            name: string;
            mobile: string;
        } | null;
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
        updatedAt: Date;
        createdAt: Date;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.CropProblemStatus;
        title: string;
        description: string;
        assignedAdvisorId: string | null;
        cropCycleId: string;
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
    }>;
}
