import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappBotService } from './whatsapp.service';
export interface GroupSyncResult {
    groupJid: string;
    totalActiveEligible: number;
    addedCount: number;
    inviteSentCount: number;
    removedCount: number;
    skippedCount: number;
    timestamp: string;
}
export declare class WhatsAppGroupSyncService implements OnModuleInit {
    private readonly prisma;
    private readonly whatsappBotService;
    private readonly configService;
    private readonly logger;
    private syncIntervalMs;
    constructor(prisma: PrismaService, whatsappBotService: WhatsappBotService, configService: ConfigService);
    onModuleInit(): Promise<void>;
    resolveGroupJidFromValue(value: string): Promise<string>;
    getAdvisorGroupJid(advisorId?: string): Promise<string>;
    getSyncSettings(): Promise<{
        isEnabled: boolean;
        autoAddEnabled: boolean;
        autoRemoveEnabled: boolean;
    }>;
    isSyncEnabled(): Promise<boolean>;
    syncAdvisorWhatsAppGroup(advisorId?: string): Promise<GroupSyncResult>;
    syncSingleFarmerGroupStatus(farmerId: string): Promise<{
        action: string;
        success: boolean;
    }>;
    autoAddNewUser(userId: string, mobile: string, name: string): Promise<void>;
    autoRemoveUser(userId: string, mobile: string, name: string): Promise<void>;
}
