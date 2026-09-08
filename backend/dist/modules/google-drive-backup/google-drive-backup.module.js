"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleDriveBackupModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const google_drive_backup_service_1 = require("./google-drive-backup.service");
const google_drive_backup_controller_1 = require("./google-drive-backup.controller");
let GoogleDriveBackupModule = class GoogleDriveBackupModule {
};
exports.GoogleDriveBackupModule = GoogleDriveBackupModule;
exports.GoogleDriveBackupModule = GoogleDriveBackupModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        providers: [google_drive_backup_service_1.GoogleDriveBackupService],
        controllers: [google_drive_backup_controller_1.GoogleDriveBackupController],
        exports: [google_drive_backup_service_1.GoogleDriveBackupService],
    })
], GoogleDriveBackupModule);
//# sourceMappingURL=google-drive-backup.module.js.map