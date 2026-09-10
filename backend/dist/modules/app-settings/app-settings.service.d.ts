import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';
import { FeatureFlagsMap } from '../../common/constants/feature-flags.constant';
export declare class AppSettingsService {
    private readonly prisma;
    private cache;
    private readonly CACHE_TTL_MS;
    constructor(prisma: PrismaService);
    clearCache(): void;
    get(): Promise<any>;
    getSupportContact(): Promise<{
        name: any;
        mobile: any;
        email: any;
    }>;
    update(admin: AuthUser, dto: UpdateAppSettingsDto): Promise<{
        id: string;
        whatsappGroupJid: string | null;
        upiId: string | null;
        updatedAt: Date;
        updatedById: string | null;
        appName: string;
        logoUrl: string | null;
        tagline: string | null;
        upiPayeeName: string | null;
        adminName: string | null;
        adminMobile: string | null;
        adminEmail: string | null;
        groupVoiceCallEnabled: boolean;
        whatsappGroupSyncEnabled: boolean;
        whatsappAutoAddEnabled: boolean;
        whatsappAutoRemoveEnabled: boolean;
        featureFlags: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getFeatureFlags(): Promise<FeatureFlagsMap>;
    updateFeatureFlags(admin: AuthUser, flags: FeatureFlagsMap): Promise<{
        id: string;
        whatsappGroupJid: string | null;
        upiId: string | null;
        updatedAt: Date;
        updatedById: string | null;
        appName: string;
        logoUrl: string | null;
        tagline: string | null;
        upiPayeeName: string | null;
        adminName: string | null;
        adminMobile: string | null;
        adminEmail: string | null;
        groupVoiceCallEnabled: boolean;
        whatsappGroupSyncEnabled: boolean;
        whatsappAutoAddEnabled: boolean;
        whatsappAutoRemoveEnabled: boolean;
        featureFlags: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
