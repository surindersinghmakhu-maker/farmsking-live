import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { AuthUser } from '../../common/types/auth-user.type';
export interface MediaStoreRecord {
    id: string;
    uploadedById: string | null;
    cropId: string | null;
    fileUrl: string;
    thumbnailUrl: string | null;
    mediaType: string;
    mimeType: string;
    originalName: string;
    sizeBytes: number;
    provider: string;
    bucketName: string | null;
    storagePath: string | null;
    isArchived: boolean;
    archivedAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare class MediaStoreService {
    private readonly prisma;
    private readonly uploadsService;
    private readonly logger;
    constructor(prisma: PrismaService, uploadsService: UploadsService);
    uploadFile(user: AuthUser, file: any, cropId?: string, mediaType?: string): Promise<MediaStoreRecord>;
    uploadBase64(user: AuthUser, dataUri: string, cropId?: string, mediaType?: string, customFilename?: string): Promise<MediaStoreRecord>;
    getMediaForCrop(cropId: string): Promise<MediaStoreRecord[]>;
    listAll(cropId?: string, mediaType?: string, provider?: string, limit?: number): Promise<MediaStoreRecord[]>;
    archiveCropMedia(cropId: string, retentionDays?: number): Promise<{
        updatedCount: number;
    }>;
    deleteMedia(id: string, user: AuthUser): Promise<{
        success: boolean;
    }>;
}
