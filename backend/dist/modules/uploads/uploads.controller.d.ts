import type { AuthUser } from '../../common/types/auth-user.type';
import { UploadsService } from './uploads.service';
export declare class UploadsController {
    private readonly uploadsService;
    constructor(uploadsService: UploadsService);
    upload(user: AuthUser, file: any): Promise<{
        provider: string;
        id: string;
        createdAt: Date;
        uploadedById: string;
        fileUrl: string;
        mimeType: string;
        originalName: string;
        sizeBytes: number;
    }>;
    uploadBase64(user: AuthUser, body: {
        dataUri: string;
        filename?: string;
        folder?: string;
    }): Promise<{
        provider: string;
        id: string;
        createdAt: Date;
        uploadedById: string;
        fileUrl: string;
        mimeType: string;
        originalName: string;
        sizeBytes: number;
    }>;
}
