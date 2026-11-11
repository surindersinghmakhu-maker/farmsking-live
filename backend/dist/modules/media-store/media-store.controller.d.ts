import type { AuthUser } from '../../common/types/auth-user.type';
import { MediaStoreService } from './media-store.service';
import { SaveCropRemarkDto } from './dto/save-crop-remark.dto';
export declare class MediaStoreController {
    private readonly mediaStoreService;
    constructor(mediaStoreService: MediaStoreService);
    uploadFile(user: AuthUser, file: any, cropId?: string, mediaType?: string): Promise<import("./media-store.service").MediaStoreRecord>;
    uploadBase64(user: AuthUser, body: {
        dataUri: string;
        cropId?: string;
        mediaType?: string;
        filename?: string;
    }): Promise<import("./media-store.service").MediaStoreRecord>;
    getCropMedia(cropId: string, scope?: 'active' | 'all'): Promise<import("./media-store.service").MediaStoreRecord[]>;
    getCropRemark(cropId: string): Promise<{
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
    saveCropRemark(user: AuthUser, cropId: string, body: SaveCropRemarkDto): Promise<{
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
    listAll(cropId?: string, mediaType?: string, provider?: string, limit?: string): Promise<import("./media-store.service").MediaStoreRecord[]>;
    archiveCropMedia(cropId: string, retentionDays?: number): Promise<{
        updatedCount: number;
    }>;
    deleteMedia(user: AuthUser, id: string): Promise<{
        success: boolean;
    }>;
}
