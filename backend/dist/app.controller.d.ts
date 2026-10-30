import { AppService } from './app.service';
import { PrismaService } from './modules/prisma/prisma.service';
export declare class AppController {
    private readonly appService;
    private readonly prisma;
    constructor(appService: AppService, prisma: PrismaService);
    getHello(): string;
    getHealth(): {
        status: string;
        timestamp: string;
    };
    getDosePage(): string;
    syncUsers(body: {
        users: any[];
    }): Promise<{
        success: boolean;
        count: number;
        details: any[];
    }>;
    getPrivacyPolicyPage(): string;
    getAccountDeletionPage(): string;
    getPrivacyPolicyJson(): {
        success: boolean;
        appName: string;
        version: string;
        lastUpdated: string;
        modules: import("./common/utils/privacy-policy-generator").PolicyPermissionModule[];
        deletionUrl: string;
        supportEmail: string;
        helpline: string;
    };
    requestAccountDeletion(body: {
        mobile?: string;
        password?: string;
        reason?: string;
    }): Promise<{
        success: boolean;
        message: string;
        deletedAt: string;
    }>;
}
