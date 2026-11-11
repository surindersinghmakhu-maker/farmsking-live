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
var MediaStoreService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaStoreService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma_service_1 = require("../prisma/prisma.service");
const uploads_service_1 = require("../uploads/uploads.service");
let MediaStoreService = MediaStoreService_1 = class MediaStoreService {
    constructor(prisma, uploadsService) {
        this.prisma = prisma;
        this.uploadsService = uploadsService;
        this.logger = new common_1.Logger(MediaStoreService_1.name);
    }
    async uploadFile(user, file, cropId, mediaType) {
        const isAudio = file.mimetype?.startsWith('audio/') || false;
        const isVideo = file.mimetype?.startsWith('video/') || false;
        const finalMediaType = mediaType || (isAudio ? 'AUDIO' : isVideo ? 'VIDEO' : 'IMAGE');
        const uploaded = await this.uploadsService.create(user, file);
        const id = (0, crypto_1.randomUUID)();
        await this.prisma.$executeRawUnsafe(`
      INSERT INTO "media_store" (
        "id", "uploadedById", "cropId", "fileUrl", "mediaType", "mimeType", 
        "originalName", "sizeBytes", "provider", "storagePath", "expiresAt", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP + INTERVAL '7 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, id, user.id, cropId || null, uploaded.fileUrl, finalMediaType, uploaded.mimeType, uploaded.originalName, uploaded.sizeBytes, uploaded.provider || 'CLOUDFLARE_R2', uploaded.storageKey || `crops/${uploaded.originalName}`);
        const rows = await this.prisma.$queryRawUnsafe(`SELECT * FROM "media_store" WHERE "id" = $1 LIMIT 1`, id);
        return rows[0];
    }
    async uploadBase64(user, dataUri, cropId, mediaType, customFilename) {
        const isVideo = (dataUri.includes('video/') || (customFilename && (customFilename.endsWith('.mp4') || customFilename.endsWith('.webm')))) ? true : false;
        const finalMediaType = mediaType || (isVideo ? 'VIDEO' : 'IMAGE');
        const uploaded = await this.uploadsService.createFromBase64(user, dataUri, customFilename, 'crops');
        const id = (0, crypto_1.randomUUID)();
        await this.prisma.$executeRawUnsafe(`
      INSERT INTO "media_store" (
        "id", "uploadedById", "cropId", "fileUrl", "mediaType", "mimeType", 
        "originalName", "sizeBytes", "provider", "storagePath", "expiresAt", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP + INTERVAL '7 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, id, user.id, cropId || null, uploaded.fileUrl, finalMediaType, uploaded.mimeType, uploaded.originalName, uploaded.sizeBytes, uploaded.provider || 'CLOUDFLARE_R2', uploaded.storageKey || `crops/${uploaded.originalName}`);
        const rows = await this.prisma.$queryRawUnsafe(`SELECT * FROM "media_store" WHERE "id" = $1 LIMIT 1`, id);
        return rows[0];
    }
    async getMediaForCrop(cropId, scope = 'all') {
        const filterActive = scope === 'active'
            ? ` AND COALESCE("expiresAt", "createdAt" + INTERVAL '7 days') > CURRENT_TIMESTAMP`
            : '';
        const rows = await this.prisma.$queryRawUnsafe(`
      SELECT * FROM "media_store"
      WHERE "cropId" = $1${filterActive}
      ORDER BY "createdAt" DESC
      `, cropId);
        return rows;
    }
    async ensureCropRemarksTable() {
        await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "crop_remarks" (
        "cropId" TEXT NOT NULL PRIMARY KEY,
        "uploadedById" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
        "remarksText" TEXT NOT NULL DEFAULT '',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
        await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "crop_remarks_history" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "cropId" TEXT NOT NULL,
        "uploadedById" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
        "remarksText" TEXT NOT NULL DEFAULT '',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days')
      );
    `);
        await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "crop_remarks_history_cropId_idx" ON "crop_remarks_history"("cropId");`);
    }
    async getCropRemark(cropId) {
        await this.ensureCropRemarksTable();
        const rows = await this.prisma.$queryRawUnsafe(`
      SELECT "id", "remarksText", "createdAt", "expiresAt"
      FROM "crop_remarks_history"
      WHERE "cropId" = $1
      ORDER BY "createdAt" DESC
      `, cropId);
        const nowMs = Date.now();
        const history = (rows || []).map((r) => {
            const expMs = r.expiresAt ? new Date(r.expiresAt).getTime() : new Date(r.createdAt).getTime() + 7 * 86400_000;
            return {
                id: r.id,
                remarksText: r.remarksText || '',
                createdAt: r.createdAt,
                expiresAt: r.expiresAt,
                isActiveDisplay: expMs > nowMs,
            };
        });
        const activeEntry = history.find((h) => h.isActiveDisplay && h.remarksText.trim().length > 0);
        return {
            cropId,
            remarksText: activeEntry?.remarksText || '',
            createdAt: activeEntry?.createdAt || null,
            expiresAt: activeEntry?.expiresAt || null,
            isActiveDisplay: Boolean(activeEntry),
            history,
        };
    }
    async saveCropRemark(user, cropId, rawRemarksText) {
        await this.ensureCropRemarksTable();
        const trimmed = String(rawRemarksText || '').trim().slice(0, 150);
        if (!trimmed) {
            await this.prisma.$executeRawUnsafe(`DELETE FROM "crop_remarks_history" WHERE "cropId" = $1 AND "expiresAt" > CURRENT_TIMESTAMP`, cropId);
            return this.getCropRemark(cropId);
        }
        const id = (0, crypto_1.randomUUID)();
        await this.prisma.$executeRawUnsafe(`
      INSERT INTO "crop_remarks_history" ("id", "cropId", "uploadedById", "remarksText", "createdAt", "expiresAt")
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days')
      `, id, cropId, user.id, trimmed);
        await this.prisma.$executeRawUnsafe(`
      INSERT INTO "crop_remarks" ("cropId", "uploadedById", "remarksText", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("cropId") DO UPDATE SET
        "uploadedById" = EXCLUDED."uploadedById",
        "remarksText" = EXCLUDED."remarksText",
        "updatedAt" = CURRENT_TIMESTAMP
      `, cropId, user.id, trimmed);
        return this.getCropRemark(cropId);
    }
    async listAll(cropId, mediaType, provider, limit = 50) {
        let query = `SELECT * FROM "media_store" WHERE 1=1`;
        const params = [];
        if (cropId) {
            params.push(cropId);
            query += ` AND "cropId" = $${params.length}`;
        }
        if (mediaType) {
            params.push(mediaType.toUpperCase());
            query += ` AND "mediaType" = $${params.length}`;
        }
        if (provider) {
            params.push(provider.toUpperCase());
            query += ` AND "provider" = $${params.length}`;
        }
        params.push(limit);
        query += ` ORDER BY "createdAt" DESC LIMIT $${params.length}`;
        const rows = await this.prisma.$queryRawUnsafe(query, ...params);
        return rows;
    }
    async archiveCropMedia(cropId, retentionDays = 30) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + retentionDays);
        const result = await this.prisma.$executeRawUnsafe(`
      UPDATE "media_store"
      SET "isArchived" = true,
          "archivedAt" = CURRENT_TIMESTAMP,
          "expiresAt" = $2
      WHERE "cropId" = $1
      `, cropId, expiresAt);
        this.logger.log(`[MediaStore] Crop ${cropId} media archived with ${retentionDays}-day retention policy.`);
        return { updatedCount: Number(result) };
    }
    async deleteMedia(id, user) {
        const rows = await this.prisma.$queryRawUnsafe(`SELECT * FROM "media_store" WHERE "id" = $1 LIMIT 1`, id);
        const existing = rows?.[0];
        if (!existing) {
            throw new common_1.NotFoundException('Media record not found.');
        }
        const privilegedRoles = ['ADMIN', 'SUPER_ADMIN', 'OPERATOR', 'ADVISOR', 'SUPERVISOR'];
        if (existing.uploadedById &&
            existing.uploadedById !== user.id &&
            !privilegedRoles.includes(String(user.role || '').toUpperCase())) {
            throw new common_1.ForbiddenException('You do not have permission to delete this media item.');
        }
        await this.prisma.$executeRawUnsafe(`DELETE FROM "media_store" WHERE "id" = $1`, id);
        if (existing.provider === 'LOCAL' && existing.storagePath) {
            const localFile = path.resolve(process.cwd(), 'uploads', existing.storagePath);
            if (localFile.startsWith(path.resolve(process.cwd(), 'uploads')) && fs.existsSync(localFile)) {
                try {
                    fs.unlinkSync(localFile);
                }
                catch {
                }
            }
        }
        return { success: true };
    }
};
exports.MediaStoreService = MediaStoreService;
exports.MediaStoreService = MediaStoreService = MediaStoreService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        uploads_service_1.UploadsService])
], MediaStoreService);
//# sourceMappingURL=media-store.service.js.map