import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappBotService } from '../whatsapp/whatsapp.service';
export interface BackupStatus {
    isDriveSyncActive: boolean;
    cloudFolder: string;
    lastBackupTimestamp: string | null;
    lastBackupFileName: string | null;
    totalBackupsCount: number;
}
export declare class GoogleDriveBackupService implements OnModuleInit {
    private readonly prisma;
    private readonly whatsappBotService?;
    private readonly logger;
    private backupDir;
    private lastBackupTime;
    private lastFileName;
    constructor(prisma: PrismaService, whatsappBotService?: WhatsappBotService | undefined);
    onModuleInit(): Promise<void>;
    private ensureBackupDirectory;
    private purgeOldBackups;
    performAutoBackup(triggerSource?: string): Promise<{
        fileName: string;
        sizeBytes: number;
        timestamp: string;
    }>;
    getBackupStatus(): BackupStatus;
    getLatestBackupPath(): string | null;
    restoreFromSnapshot(snapshotObj: any): Promise<{
        success: boolean;
        restoredUsers: number;
        message: string;
    }>;
    restoreLatestBackup(): Promise<{
        success: boolean;
        restoredUsers: number;
        message: string;
    }>;
}
