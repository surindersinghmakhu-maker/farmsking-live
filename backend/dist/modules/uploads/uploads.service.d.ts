import { PrismaService } from '../prisma/prisma.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { AuthUser } from '../../common/types/auth-user.type';
export interface UploadedFileObject {
    filename?: string;
    mimetype: string;
    originalname: string;
    size: number;
    buffer?: Buffer;
    path?: string;
}
export declare class UploadsService {
    private readonly prisma;
    private readonly appSettingsService;
    private readonly logger;
    constructor(prisma: PrismaService, appSettingsService: AppSettingsService);
    uploadToActiveStorage(buffer: Buffer, filename: string, mimetype: string, folder?: string): Promise<{
        fileUrl: string;
        provider: string;
    }>;
    private sanitizeUploadFolder;
    private assertSafeMediaMime;
    private inferExtension;
    create(user: AuthUser, file: UploadedFileObject): Promise<{
        provider: string;
        storageKey: string;
        id: string;
        createdAt: Date;
        fileUrl: string;
        mimeType: string;
        originalName: string;
        sizeBytes: number;
        uploadedById: string;
    }>;
    createFromBase64(user: AuthUser, dataUri: string, customFilename?: string, folder?: string): Promise<{
        provider: string;
        storageKey: string;
        id: string;
        createdAt: Date;
        fileUrl: string;
        mimeType: string;
        originalName: string;
        sizeBytes: number;
        uploadedById: string;
    }>;
}
