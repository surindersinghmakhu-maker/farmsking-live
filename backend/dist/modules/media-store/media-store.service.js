"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MediaStoreService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaStoreService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const uploads_service_1 = require("../uploads/uploads.service");
let MediaStoreService = MediaStoreService_1 = class MediaStoreService {
    constructor(prisma, uploadsService) {
        this.prisma = prisma;
        this.uploadsService = uploadsService;
        this.logger = new common_1.Logger(MediaStoreService_1.name);
    }
    async uploadFile(user, file, cropId, mediaType) {
        const isVideo = file.mimetype?.startsWith('video/') || false;
        const finalMediaType = mediaType || (isVideo ? 'VIDEO' : 'IMAGE');
        const uploaded = await this.uploadsService.create(user, file);
        const id = (0, crypto_1.randomUUID)();
        await this.prisma.$executeRawUnsafe(`
      INSERT INTO "media_store" (
        "id", "uploadedById", "cropId", "fileUrl", "mediaType", "mimeType", 
        "originalName", "sizeBytes", "provider", "storagePath", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, id, user.id, cropId || null, uploaded.fileUrl, finalMediaType, uploaded.mimeType, uploaded.originalName, uploaded.sizeBytes, uploaded.provider || 'CLOUDFLARE_R2', `crops/${uploaded.originalName}`);
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
        "originalName", "sizeBytes", "provider", "storagePath", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, id, user.id, cropId || null, uploaded.fileUrl, finalMediaType, uploaded.mimeType, uploaded.originalName, uploaded.sizeBytes, uploaded.provider || 'CLOUDFLARE_R2', `crops/${uploaded.originalName}`);
        const rows = await this.prisma.$queryRawUnsafe(`SELECT * FROM "media_store" WHERE "id" = $1 LIMIT 1`, id);
        return rows[0];
    }
    async getMediaForCrop(cropId) {
        const rows = await this.prisma.$queryRawUnsafe(`
      SELECT * FROM "media_store"
      WHERE "cropId" = $1
      ORDER BY "createdAt" DESC
      `, cropId);
        return rows;
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
        await this.prisma.$executeRawUnsafe(`DELETE FROM "media_store" WHERE "id" = $1`, id);
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