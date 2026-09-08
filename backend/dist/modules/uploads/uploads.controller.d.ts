import type { AuthUser } from '../../common/types/auth-user.type';
import { UploadsService } from './uploads.service';
export declare class UploadsController {
    private readonly uploadsService;
    constructor(uploadsService: UploadsService);
    upload(user: AuthUser, file: Express.Multer.File): import(".prisma/client").Prisma.Prisma__UploadClient<{
        id: string;
        createdAt: Date;
        uploadedById: string;
        fileUrl: string;
        mimeType: string;
        originalName: string;
        sizeBytes: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
}
