import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export interface BackupStatus {
    isDriveSyncActive: boolean;
    cloudFolder: string;
    lastBackupTimestamp: string | null;
    lastBackupFileName: string | null;
    totalBackupsCount: number;
}
export declare class GoogleDriveBackupService implements OnModuleInit {
    private readonly prisma;
    private readonly logger;
    private backupDir;
    private lastBackupTime;
    private lastFileName;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    private ensureBackupDirectory;
    performAutoBackup(triggerSource?: string): Promise<{
        fileName: string;
        sizeBytes: number;
        timestamp: string;
    }>;
    getBackupStatus(): BackupStatus;
    getLatestBackupPath(): string | null;
}
