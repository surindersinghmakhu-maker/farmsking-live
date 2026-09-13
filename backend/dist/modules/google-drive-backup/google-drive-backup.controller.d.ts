import type { Response } from 'express';
import { GoogleDriveBackupService } from './google-drive-backup.service';
export declare class GoogleDriveBackupController {
    private readonly backupService;
    constructor(backupService: GoogleDriveBackupService);
    getStatus(): import("./google-drive-backup.service").BackupStatus;
    triggerBackup(): Promise<{
        message: string;
        result: {
            fileName: string;
            sizeBytes: number;
            timestamp: string;
        };
    }>;
    downloadBackup(res: Response): void;
}
