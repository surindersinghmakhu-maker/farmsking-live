import type { AuthUser } from '../../common/types/auth-user.type';
import { MediaStoreService } from './media-store.service';
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
    getCropMedia(cropId: string): Promise<import("./media-store.service").MediaStoreRecord[]>;
    listAll(cropId?: string, mediaType?: string, provider?: string, limit?: string): Promise<import("./media-store.service").MediaStoreRecord[]>;
    archiveCropMedia(cropId: string, retentionDays?: number): Promise<{
        updatedCount: number;
    }>;
    deleteMedia(user: AuthUser, id: string): Promise<{
        success: boolean;
    }>;
}
