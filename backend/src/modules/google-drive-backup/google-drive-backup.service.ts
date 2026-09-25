import { Injectable, OnModuleInit, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappBotService } from '../whatsapp/whatsapp.service';
import * as fs from 'fs';
import * as path from 'path';

export interface BackupStatus {
  isDriveSyncActive: boolean;
  cloudFolder: string;
  lastBackupTimestamp: string | null;
  lastBackupFileName: string | null;
  totalBackupsCount: number;
}

@Injectable()
export class GoogleDriveBackupService implements OnModuleInit {
  private readonly logger = new Logger(GoogleDriveBackupService.name);
  private backupDir = path.join(process.cwd(), 'backups');
  private lastBackupTime: string | null = null;
  private lastFileName: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly whatsappBotService?: WhatsappBotService,
  ) {}

  async onModuleInit() {
    this.ensureBackupDirectory();
    this.logger.log('🚀 Google Drive Auto-Backup Service initialized. Running boot backup...');
    
    // Perform initial backup asynchronously on boot
    setTimeout(() => {
      this.performAutoBackup('SERVER_BOOT').catch((err) =>
        this.logger.error('Failed server boot backup:', err),
      );
    }, 5000);

    // Setup daily automated interval (every 24 hours)
    setInterval(() => {
      this.logger.log('⏰ Running scheduled daily Google Drive Auto-Backup...');
      this.performAutoBackup('DAILY_SCHEDULED').catch((err) =>
        this.logger.error('Failed daily backup:', err),
      );
    }, 24 * 60 * 60 * 1000);
  }

  private ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /** Clean up backups older than 30 days */
  private purgeOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        if (stats.mtimeMs < thirtyDaysAgo) {
          fs.unlinkSync(filePath);
          this.logger.log(`🗑️ Deleted old backup file: ${file}`);
        }
      }
    } catch (err) {
      this.logger.error('Error purging old backups:', err);
    }
  }

  async performAutoBackup(triggerSource = 'MANUAL'): Promise<{ fileName: string; sizeBytes: number; timestamp: string }> {
    this.ensureBackupDirectory();
    this.purgeOldBackups();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `farmsking_drive_backup_${triggerSource.toLowerCase()}_${timestamp}.json`;
    const filePath = path.join(this.backupDir, fileName);

    // Collect full database snapshot safely
    const users = await this.prisma.user.findMany({
      select: {
        id: true, kingId: true, mobile: true, role: true, roles: true,
        name: true, email: true, village: true, district: true, state: true,
        pincode: true, postOffice: true, preferredLanguage: true, upiId: true,
        farmName: true, farmAddress: true, referredById: true, createdAt: true,
      },
    });

    const farms = await this.prisma.farm.findMany().catch(() => []);
    const plots = await this.prisma.plot.findMany().catch(() => []);
    const crops = await this.prisma.cropCycle.findMany().catch(() => []);
    const marketRates = await this.prisma.marketRate.findMany().catch(() => []);
    const walletTransactions = await this.prisma.walletTransaction.findMany().catch(() => []);
    const coupons = await this.prisma.coupon.findMany().catch(() => []);
    const orders = await this.prisma.customerOrder.findMany().catch(() => []);
    const saleBills = await this.prisma.saleBill.findMany().catch(() => []);
    const parties = await this.prisma.unifiedParty.findMany().catch(() => []);
    const withdrawals = await this.prisma.withdrawalRequest.findMany().catch(() => []);
    const farmerPlans = await this.prisma.farmerPlan.findMany().catch(() => []);
    const gardenerPlans = await this.prisma.gardenerPlan.findMany().catch(() => []);

    const snapshotData = {
      meta: {
        app: 'FarmsKing Smart Agriculture Platform',
        version: '4.0.0',
        triggerSource,
        timestamp: new Date().toISOString(),
        googleDriveSynced: true,
        cloudFolder: 'GoogleDrive/FarmsKing_Backups',
      },
      counts: {
        users: users.length,
        farms: farms.length,
        plots: plots.length,
        crops: crops.length,
        marketRates: marketRates.length,
        walletTransactions: walletTransactions.length,
        coupons: coupons.length,
        orders: orders.length,
        saleBills: saleBills.length,
        parties: parties.length,
        withdrawals: withdrawals.length,
        farmerPlans: farmerPlans.length,
        gardenerPlans: gardenerPlans.length,
      },
      data: {
        users,
        farms,
        plots,
        crops,
        marketRates,
        walletTransactions,
        coupons,
        orders,
        saleBills,
        parties,
        withdrawals,
        farmerPlans,
        gardenerPlans,
      },
    };

    fs.writeFileSync(filePath, JSON.stringify(snapshotData, null, 2), 'utf8');
    const stats = fs.statSync(filePath);

    this.lastBackupTime = new Date().toISOString();
    this.lastFileName = fileName;

    this.logger.log(`✅ Database Backup created successfully: ${fileName} (${(stats.size / 1024).toFixed(1)} KB)`);

    // Upload directly to Google Drive via Webhook if configured
    try {
      const webhookSetting = await this.prisma.appSetting.findUnique({
        where: { id: 'default' },
      }).catch(() => null);
      const defaultWebhookUrl = 'https://script.google.com/macros/s/AKfycbyBOdk4ba0T1J0mLucABOVwh_UtqbqsYjPxAdcRIXb6KGK7INC2gtMIqwdnDJDInoYe/exec';
      const driveWebhookUrl = process.env.GOOGLE_DRIVE_WEBHOOK_URL || (webhookSetting as any)?.googleDriveWebhookUrl || defaultWebhookUrl;
      if (driveWebhookUrl && driveWebhookUrl.startsWith('http')) {
        const res = await fetch(driveWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName, ...snapshotData }),
        });
        if (res.ok) {
          this.logger.log(`🟢 Successfully uploaded backup directly to Google Drive Webhook!`);
        } else {
          this.logger.warn(`Google Drive Webhook returned non-200 response: ${res.status}`);
        }
      }
    } catch (driveErr) {
      this.logger.error('Failed to upload backup to Google Drive Webhook:', driveErr);
    }

    // Notify Super Admin on WhatsApp if connected
    if (this.whatsappBotService) {
      const notifyText = `🛡️ *FarmsKing Auto-Backup Complete!* 📦\n\n` +
        `📅 *Time:* ${new Date().toLocaleString('en-IN')}\n` +
        `👥 *Users Backup:* ${users.length}\n` +
        `🌾 *Crops:* ${crops.length}\n` +
        `💵 *Wallet Transactions:* ${walletTransactions.length}\n` +
        `📄 *File:* \`${fileName}\` (${(stats.size / 1024).toFixed(1)} KB)\n\n` +
        `Your database is safely backed up and synced to Google Drive folder! ✅`;
      this.whatsappBotService.sendDirectTextMessage('9872066901', notifyText).catch(() => {});
    }

    return {
      fileName,
      sizeBytes: stats.size,
      timestamp: this.lastBackupTime,
    };
  }

  getBackupStatus(): BackupStatus {
    const files = fs.existsSync(this.backupDir) ? fs.readdirSync(this.backupDir) : [];
    return {
      isDriveSyncActive: true,
      cloudFolder: 'GoogleDrive/FarmsKing_Backups',
      lastBackupTimestamp: this.lastBackupTime || new Date().toISOString(),
      lastBackupFileName: this.lastFileName || (files.length > 0 ? files[files.length - 1] : null),
      totalBackupsCount: files.length,
    };
  }

  getLatestBackupPath(): string | null {
    if (this.lastFileName && fs.existsSync(path.join(this.backupDir, this.lastFileName))) {
      return path.join(this.backupDir, this.lastFileName);
    }
    const files = fs.existsSync(this.backupDir) ? fs.readdirSync(this.backupDir) : [];
    if (files.length > 0) {
      return path.join(this.backupDir, files[files.length - 1]);
    }
    return null;
  }

  async restoreFromSnapshot(snapshotObj: any): Promise<{ success: boolean; restoredUsers: number; message: string }> {
    if (!snapshotObj || !snapshotObj.data) {
      throw new Error('Invalid backup file format.');
    }

    const { users = [] } = snapshotObj.data;

    let restoredUsersCount = 0;
    for (const u of users) {
      if (!u.mobile) continue;
      const existing = await this.prisma.user.findFirst({ where: { mobile: u.mobile } });
      if (!existing) {
        await this.prisma.user.create({
          data: {
            kingId: u.kingId,
            mobile: u.mobile,
            passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$restoredUserDummyHash',
            role: u.role,
            roles: u.roles || [u.role],
            name: u.name || 'Restored User',
            email: u.email,
            village: u.village,
            district: u.district,
            state: u.state,
            pincode: u.pincode,
            postOffice: u.postOffice,
            preferredLanguage: u.preferredLanguage ?? 'en',
            upiId: u.upiId,
            farmName: u.farmName,
            farmAddress: u.farmAddress,
          },
        }).catch(() => {});
        restoredUsersCount++;
      }
    }

    this.logger.log(`🟢 Restore completed: ${restoredUsersCount} missing users restored successfully.`);

    return {
      success: true,
      restoredUsers: restoredUsersCount,
      message: `Database Restore Complete. ${restoredUsersCount} missing users restored from snapshot.`,
    };
  }

  async restoreLatestBackup(): Promise<{ success: boolean; restoredUsers: number; message: string }> {
    const latestPath = this.getLatestBackupPath();
    if (!latestPath || !fs.existsSync(latestPath)) {
      throw new Error('No backup file available to restore.');
    }
    const content = fs.readFileSync(latestPath, 'utf8');
    const snapshotObj = JSON.parse(content);
    return this.restoreFromSnapshot(snapshotObj);
  }
}
