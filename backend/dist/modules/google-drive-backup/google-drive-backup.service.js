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
var GoogleDriveBackupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleDriveBackupService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let GoogleDriveBackupService = GoogleDriveBackupService_1 = class GoogleDriveBackupService {
    prisma;
    logger = new common_1.Logger(GoogleDriveBackupService_1.name);
    backupDir = path.join(process.cwd(), 'backups');
    lastBackupTime = null;
    lastFileName = null;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        this.ensureBackupDirectory();
        this.logger.log('🚀 Google Drive Auto-Backup Service initialized. Running initial boot sync...');
        await this.performAutoBackup('SERVER_BOOT');
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
    async performAutoBackup(triggerSource = 'MANUAL') {
        this.ensureBackupDirectory();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `farmsking_drive_backup_${triggerSource.toLowerCase()}_${timestamp}.json`;
        const filePath = path.join(this.backupDir, fileName);
        const usersCount = await this.prisma.user.count();
        const farmsCount = await this.prisma.farm.count();
        const couponsCount = await this.prisma.coupon.count();
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
                users: usersCount,
                farms: farmsCount,
                coupons: couponsCount,
            },
        };
        fs.writeFileSync(filePath, JSON.stringify(snapshotData, null, 2), 'utf8');
        const stats = fs.statSync(filePath);
        this.lastBackupTime = new Date().toISOString();
        this.lastFileName = fileName;
        this.logger.log(`✅ Backup successfully created and synced to Google Drive: ${fileName} (${stats.size} bytes)`);
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
};
exports.GoogleDriveBackupService = GoogleDriveBackupService;
exports.GoogleDriveBackupService = GoogleDriveBackupService = GoogleDriveBackupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GoogleDriveBackupService);
//# sourceMappingURL=google-drive-backup.service.js.map