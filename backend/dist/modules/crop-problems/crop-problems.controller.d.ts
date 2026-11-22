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
    findMine(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
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
    findAssigned(user: AuthUser): Promise<({
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
    findOne(user: AuthUser, id: string): Promise<{
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
