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
    private isStaffAdmin;
    private assertCropAccess;
    uploadFile(user: AuthUser, file: any, cropId?: string, mediaType?: string): Promise<MediaStoreRecord>;
    uploadBase64(user: AuthUser, dataUri: string, cropId?: string, mediaType?: string, customFilename?: string): Promise<MediaStoreRecord>;
    getMediaForCrop(user: AuthUser, cropId: string, scope?: 'active' | 'all'): Promise<MediaStoreRecord[]>;
    private ensureCropRemarksTable;
    getCropRemark(user: AuthUser, cropId: string): Promise<{
        cropId: string;
        remarksText: string;
        createdAt: Date | null;
        expiresAt: Date | null;
        isActiveDisplay: boolean;
        history: Array<{
            id: string;
            remarksText: string;
            createdAt: Date;
            expiresAt: Date;
            isActiveDisplay: boolean;
        }>;
    }>;
    saveCropRemark(user: AuthUser, cropId: string, rawRemarksText: string): Promise<{
        cropId: string;
        remarksText: string;
        createdAt: Date | null;
        expiresAt: Date | null;
        isActiveDisplay: boolean;
        history: Array<{
            id: string;
            remarksText: string;
            createdAt: Date;
            expiresAt: Date;
            isActiveDisplay: boolean;
        }>;
    }>;
    listAll(user: AuthUser, cropId?: string, mediaType?: string, provider?: string, limit?: number): Promise<MediaStoreRecord[]>;
    archiveCropMedia(user: AuthUser, cropId: string, retentionDays?: number): Promise<{
        updatedCount: number;
    }>;
    deleteMedia(id: string, user: AuthUser): Promise<{
        success: boolean;
    }>;
}
