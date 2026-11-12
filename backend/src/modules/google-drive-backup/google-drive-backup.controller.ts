import { Controller, Get, Post, Body, Res, NotFoundException, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GoogleDriveBackupService } from './google-drive-backup.service';
import * as fs from 'fs';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
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

  @Post('restore-latest')
  async restoreLatest() {
    return this.backupService.restoreLatestBackup();
  }

  @Post('restore')
  async restoreFromData(@Body() body: { snapshotData: any }) {
    return this.backupService.restoreFromSnapshot(body.snapshotData);
  }
}
