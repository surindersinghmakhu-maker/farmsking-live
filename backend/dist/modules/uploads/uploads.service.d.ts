import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
export declare class UploadsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(user: AuthUser, file: Express.Multer.File): import(".prisma/client").Prisma.Prisma__UploadClient<{
        id: string;
        createdAt: Date;
        uploadedById: string;
        fileUrl: string;
        mimeType: string;
        originalName: string;
        sizeBytes: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
}
