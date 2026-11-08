import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappBotService } from './whatsapp.service';
export declare class WhatsAppGroupSyncService implements OnModuleInit {
    private readonly prisma;
    private readonly whatsappBotService;
    private readonly logger;
    constructor(prisma: PrismaService, whatsappBotService: WhatsappBotService);
    onModuleInit(): Promise<void>;
    testConnection(): Promise<{
        success: boolean;
        message: string;
    }>;
    triggerGlobalSync(): Promise<{
        success: boolean;
        message: string;
    }>;
    syncSingleFarmerGroupStatus(userId: string): Promise<void>;
    autoAddNewUser(userId: string, mobile: string, name: string): Promise<void>;
    autoRemoveUser(userId: string, mobile: string, name: string): Promise<void>;
    syncEligibleUsersToCommunityGroup(users: any[]): Promise<void>;
}
