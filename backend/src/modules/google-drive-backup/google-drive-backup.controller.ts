import { Controller, Get, Post, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { GoogleDriveBackupService } from './google-drive-backup.service';
import * as fs from 'fs';

@Controller('backup')
export class GoogleDriveBackupController {
  constructor(private readonly backupService: GoogleDriveBackupService) {}

  @Get('status')
  getStatus() {
    return this.backupService.getBackupStatus();
  }

  @Post('trigger')
  async triggerBackup() {
    const result = await this.backupService.performAutoBackup('MANUAL_SUPER_ADMIN');
    return {
      message: 'Instant Google Drive backup triggered and saved successfully!',
      result,
    };
  }

  @Get('download')
  downloadBackup(@Res() res: Response) {
    const filePath = this.backupService.getLatestBackupPath();
    if (!filePath || !fs.existsSync(filePath)) {
      throw new NotFoundException('No backup file available yet.');
    }
    return res.download(filePath);
  }
}
