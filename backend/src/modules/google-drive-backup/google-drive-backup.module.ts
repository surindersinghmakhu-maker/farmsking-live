import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GoogleDriveBackupService } from './google-drive-backup.service';
import { GoogleDriveBackupController } from './google-drive-backup.controller';

@Module({
  imports: [PrismaModule],
  providers: [GoogleDriveBackupService],
  controllers: [GoogleDriveBackupController],
  exports: [GoogleDriveBackupService],
})
export class GoogleDriveBackupModule {}
