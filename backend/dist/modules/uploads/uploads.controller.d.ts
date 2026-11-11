import type { AuthUser } from '../../common/types/auth-user.type';
import { UploadsService } from './uploads.service';
export declare class UploadsController {
    private readonly uploadsService;
    constructor(uploadsService: UploadsService);
    upload(user: AuthUser, file: any): Promise<{
        provider: string;
        storageKey: string;
        id: string;
        fileUrl: string;
        mimeType: string;
        originalName: string;
        sizeBytes: number;
        createdAt: Date;
        uploadedById: string;
    }>;
    uploadBase64(user: AuthUser, body: {
        dataUri: string;
        filename?: string;
        folder?: string;
    }): Promise<{
        provider: string;
        storageKey: string;
        id: string;
        fileUrl: string;
        mimeType: string;
        originalName: string;
        sizeBytes: number;
        createdAt: Date;
        uploadedById: string;
    }>;
}
