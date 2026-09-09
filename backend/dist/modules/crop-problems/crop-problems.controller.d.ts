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
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            id: string;
            cropName: string;
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
        createdAt: Date;
        updatedAt: Date;
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
    findMine(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        cropCycle: {
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            id: string;
            cropName: string;
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
        createdAt: Date;
        updatedAt: Date;
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
    findAssigned(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        cropCycle: {
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            id: string;
            cropName: string;
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
        createdAt: Date;
        updatedAt: Date;
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
    findOne(user: AuthUser, id: string): Promise<{
        cropCycle: {
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            id: string;
            cropName: string;
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
        createdAt: Date;
        updatedAt: Date;
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
    respond(user: AuthUser, id: string, dto: RespondCropProblemDto): Promise<{
        insertedScheduleDate: Date | null;
        cropCycle: {
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            id: string;
            cropName: string;
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
        createdAt: Date;
        updatedAt: Date;
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
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            id: string;
            cropName: string;
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
        createdAt: Date;
        updatedAt: Date;
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
            plot: {
                id: string;
                name: string;
                farmId: string;
            };
            id: string;
            cropName: string;
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
        createdAt: Date;
        updatedAt: Date;
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
