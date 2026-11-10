import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { AuthUser } from '../../common/types/auth-user.type';

export interface MediaStoreRecord {
  id: string;
  uploadedById: string | null;
  cropId: string | null;
  fileUrl: string;
  thumbnailUrl: string | null;
  mediaType: string;
  mimeType: string;
  originalName: string;
  sizeBytes: number;
  provider: string;
  bucketName: string | null;
  storagePath: string | null;
  isArchived: boolean;
  archivedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class MediaStoreService {
  private readonly logger = new Logger(MediaStoreService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  /**
   * Upload raw multipart file into Media Store (Cloudflare R2 / Firebase / Cloudinary / Local)
   */
  async uploadFile(
    user: AuthUser,
    file: any,
    cropId?: string,
    mediaType?: string,
  ): Promise<MediaStoreRecord> {
    const isVideo = file.mimetype?.startsWith('video/') || false;
    const finalMediaType = mediaType || (isVideo ? 'VIDEO' : 'IMAGE');

    const uploaded = await this.uploadsService.create(user, file);
    const id = randomUUID();

    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "media_store" (
        "id", "uploadedById", "cropId", "fileUrl", "mediaType", "mimeType", 
        "originalName", "sizeBytes", "provider", "storagePath", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      id,
      user.id,
      cropId || null,
      uploaded.fileUrl,
      finalMediaType,
      uploaded.mimeType,
      uploaded.originalName,
      uploaded.sizeBytes,
      uploaded.provider || 'CLOUDFLARE_R2',
      `crops/${uploaded.originalName}`,
    );

    const rows: any = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM "media_store" WHERE "id" = $1 LIMIT 1`,
      id,
    );

    return rows[0];
  }

  /**
   * Upload Base64 Data URI into Media Store (with live watermarking)
   */
  async uploadBase64(
    user: AuthUser,
    dataUri: string,
    cropId?: string,
    mediaType?: string,
    customFilename?: string,
  ): Promise<MediaStoreRecord> {
    const isVideo = (dataUri.includes('video/') || (customFilename && (customFilename.endsWith('.mp4') || customFilename.endsWith('.webm')))) ? true : false;
    const finalMediaType = mediaType || (isVideo ? 'VIDEO' : 'IMAGE');

    const uploaded = await this.uploadsService.createFromBase64(
      user,
      dataUri,
      customFilename,
      'crops',
    );
    const id = randomUUID();

    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "media_store" (
        "id", "uploadedById", "cropId", "fileUrl", "mediaType", "mimeType", 
        "originalName", "sizeBytes", "provider", "storagePath", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      id,
      user.id,
      cropId || null,
      uploaded.fileUrl,
      finalMediaType,
      uploaded.mimeType,
      uploaded.originalName,
      uploaded.sizeBytes,
      uploaded.provider || 'CLOUDFLARE_R2',
      `crops/${uploaded.originalName}`,
    );

    const rows: any = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM "media_store" WHERE "id" = $1 LIMIT 1`,
      id,
    );

    return rows[0];
  }

  /**
   * Retrieve all Media Store items for a given crop
   */
  async getMediaForCrop(cropId: string): Promise<MediaStoreRecord[]> {
    const rows: any = await this.prisma.$queryRawUnsafe(
      `
      SELECT * FROM "media_store"
      WHERE "cropId" = $1
      ORDER BY "createdAt" DESC
      `,
      cropId,
    );
    return rows;
  }

  /**
   * List all items from Media Store with filters
   */
  async listAll(
    cropId?: string,
    mediaType?: string,
    provider?: string,
    limit = 50,
  ): Promise<MediaStoreRecord[]> {
    let query = `SELECT * FROM "media_store" WHERE 1=1`;
    const params: any[] = [];

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

    const rows: any = await this.prisma.$queryRawUnsafe(query, ...params);
    return rows;
  }

  /**
   * Set 30-day retention countdown when crop is marked completed
   */
  async archiveCropMedia(cropId: string, retentionDays = 30): Promise<{ updatedCount: number }> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + retentionDays);

    const result = await this.prisma.$executeRawUnsafe(
      `
      UPDATE "media_store"
      SET "isArchived" = true,
          "archivedAt" = CURRENT_TIMESTAMP,
          "expiresAt" = $2
      WHERE "cropId" = $1
      `,
      cropId,
      expiresAt,
    );

    this.logger.log(`[MediaStore] Crop ${cropId} media archived with ${retentionDays}-day retention policy.`);
    return { updatedCount: Number(result) };
  }

  /**
   * Delete or remove a single media record
   */
  async deleteMedia(id: string, user: AuthUser): Promise<{ success: boolean }> {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM "media_store" WHERE "id" = $1`,
      id,
    );
    return { success: true };
  }
}

