import type { AuthUser } from '../../common/types/auth-user.type';
import { AppSettingsService } from './app-settings.service';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';
export declare class AppSettingsController {
    private readonly appSettingsService;
    constructor(appSettingsService: AppSettingsService);
    get(): Promise<any>;
    getSupportContact(): Promise<{
        name: any;
        mobile: any;
        email: any;
    }>;
    update(user: AuthUser, dto: UpdateAppSettingsDto): Promise<{
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
    getFeatureFlags(): Promise<import("../../common/constants/feature-flags.constant").FeatureFlagsMap>;
    updateFeatureFlags(user: AuthUser, flags: any): Promise<{
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
