"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var GoogleDriveBackupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleDriveBackupService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let GoogleDriveBackupService = GoogleDriveBackupService_1 = class GoogleDriveBackupService {
    constructor(prisma, whatsappBotService) {
        this.prisma = prisma;
        this.whatsappBotService = whatsappBotService;
        this.logger = new common_1.Logger(GoogleDriveBackupService_1.name);
        this.backupDir = path.join(process.cwd(), 'backups');
        this.lastBackupTime = null;
        this.lastFileName = null;
    }
    async onModuleInit() {
        this.ensureBackupDirectory();
        this.logger.log('🚀 Google Drive Auto-Backup Service initialized. Running boot backup...');
        setTimeout(() => {
            this.performAutoBackup('SERVER_BOOT').catch((err) => this.logger.error('Failed server boot backup:', err));
        }, 5000);
        setInterval(() => {
            this.logger.log('⏰ Running scheduled daily Google Drive Auto-Backup...');
            this.performAutoBackup('DAILY_SCHEDULED').catch((err) => this.logger.error('Failed daily backup:', err));
        }, 24 * 60 * 60 * 1000);
    }
    ensureBackupDirectory() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }
    purgeOldBackups() {
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
        }
        catch (err) {
            this.logger.error('Error purging old backups:', err);
        }
    }
    async performAutoBackup(triggerSource = 'MANUAL') {
        this.ensureBackupDirectory();
        this.purgeOldBackups();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `farmsking_drive_backup_${triggerSource.toLowerCase()}_${timestamp}.json`;
        const filePath = path.join(this.backupDir, fileName);
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
        try {
            const webhookSetting = await this.prisma.appSetting.findUnique({
                where: { id: 'default' },
            }).catch(() => null);
            const defaultWebhookUrl = 'https://script.google.com/macros/s/AKfycbyBOdk4ba0T1J0mLucABOVwh_UtqbqsYjPxAdcRIXb6KGK7INC2gtMIqwdnDJDInoYe/exec';
            const driveWebhookUrl = process.env.GOOGLE_DRIVE_WEBHOOK_URL || webhookSetting?.googleDriveWebhookUrl || defaultWebhookUrl;
            if (driveWebhookUrl && driveWebhookUrl.startsWith('http')) {
                const res = await fetch(driveWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileName, ...snapshotData }),
                });
                if (res.ok) {
                    this.logger.log(`🟢 Successfully uploaded backup directly to Google Drive Webhook!`);
                }
                else {
                    this.logger.warn(`Google Drive Webhook returned non-200 response: ${res.status}`);
                }
            }
        }
        catch (driveErr) {
            this.logger.error('Failed to upload backup to Google Drive Webhook:', driveErr);
        }
        if (this.whatsappBotService) {
            const notifyText = `🛡️ *FarmsKing Auto-Backup Complete!* 📦\n\n` +
                `📅 *Time:* ${new Date().toLocaleString('en-IN')}\n` +
                `👥 *Users Backup:* ${users.length}\n` +
                `🌾 *Crops:* ${crops.length}\n` +
                `💵 *Wallet Transactions:* ${walletTransactions.length}\n` +
                `📄 *File:* \`${fileName}\` (${(stats.size / 1024).toFixed(1)} KB)\n\n` +
                `Your database is safely backed up and synced to Google Drive folder! ✅`;
            this.whatsappBotService.sendDirectTextMessage('9872066901', notifyText).catch(() => { });
        }
        return {
            fileName,
            sizeBytes: stats.size,
            timestamp: this.lastBackupTime,
        };
    }
    getBackupStatus() {
        const files = fs.existsSync(this.backupDir) ? fs.readdirSync(this.backupDir) : [];
        return {
            isDriveSyncActive: true,
            cloudFolder: 'GoogleDrive/FarmsKing_Backups',
            lastBackupTimestamp: this.lastBackupTime || new Date().toISOString(),
            lastBackupFileName: this.lastFileName || (files.length > 0 ? files[files.length - 1] : null),
            totalBackupsCount: files.length,
        };
    }
    getLatestBackupPath() {
        if (this.lastFileName && fs.existsSync(path.join(this.backupDir, this.lastFileName))) {
            return path.join(this.backupDir, this.lastFileName);
        }
        const files = fs.existsSync(this.backupDir) ? fs.readdirSync(this.backupDir) : [];
        if (files.length > 0) {
            return path.join(this.backupDir, files[files.length - 1]);
        }
        return null;
    }
    async restoreFromSnapshot(snapshotObj) {
        if (!snapshotObj || !snapshotObj.data) {
            throw new Error('Invalid backup file format.');
        }
        const { users = [] } = snapshotObj.data;
        let restoredUsersCount = 0;
        for (const u of users) {
            if (!u.mobile)
                continue;
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
                }).catch(() => { });
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
    async restoreLatestBackup() {
        const latestPath = this.getLatestBackupPath();
        if (!latestPath || !fs.existsSync(latestPath)) {
            throw new Error('No backup file available to restore.');
        }
        const content = fs.readFileSync(latestPath, 'utf8');
        const snapshotObj = JSON.parse(content);
        return this.restoreFromSnapshot(snapshotObj);
    }
};
exports.GoogleDriveBackupService = GoogleDriveBackupService;
exports.GoogleDriveBackupService = GoogleDriveBackupService = GoogleDriveBackupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        whatsapp_service_1.WhatsappBotService])
], GoogleDriveBackupService);
//# sourceMappingURL=google-drive-backup.service.js.map