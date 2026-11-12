import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AdvisorAssignmentStatus, Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { getEffectiveFarmerId } from '../../common/utils/effective-farmer.util';
import { getActiveRolesList } from '../../common/utils/role-policy.util';

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

  private isStaffAdmin(user: AuthUser): boolean {
    const active = getActiveRolesList(user);
    return active.some((r) => r === Role.ADMIN || r === Role.SUPER_ADMIN || r === Role.OPERATOR);
  }

  private async assertCropAccess(user: AuthUser, cropId?: string | null): Promise<void> {
    if (!user?.id) {
      throw new ForbiddenException('Authentication required.');
    }
    if (this.isStaffAdmin(user)) return;
    if (!cropId || cropId === 'general') return;

    const crop = await this.prisma.cropCycle.findFirst({
      where: {
        OR: [{ id: cropId }, { cropId }],
        deletedAt: null,
      },
      select: {
        id: true,
        plot: {
          select: {
            farm: { select: { ownerId: true } },
          },
        },
      },
    });
    if (!crop) return;

    const ownerId = crop.plot?.farm?.ownerId;
    const effectiveFarmerId = getEffectiveFarmerId(user);
    if (ownerId && (ownerId === user.id || ownerId === effectiveFarmerId)) {
      return;
    }

    const activeRoles = getActiveRolesList(user);
    if (ownerId && activeRoles.some((r) => r === Role.ADVISOR || (r as string) === 'GARDEN_ADVISOR')) {
      const assignment = await this.prisma.advisorAssignment.findFirst({
        where: {
          farmerId: ownerId,
          advisorId: user.id,
          status: AdvisorAssignmentStatus.ACTIVE,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (assignment) return;
    }

    throw new ForbiddenException('You do not have permission to access media for this crop.');
  }

  /**
   * Upload raw multipart file into Media Store (Cloudflare R2 / Firebase / Cloudinary / Local)
   */
  async uploadFile(
    user: AuthUser,
    file: any,
    cropId?: string,
    mediaType?: string,
  ): Promise<MediaStoreRecord> {
    await this.assertCropAccess(user, cropId);
    const isAudio = file.mimetype?.startsWith('audio/') || false;
    const isVideo = file.mimetype?.startsWith('video/') || false;
    const finalMediaType = mediaType || (isAudio ? 'AUDIO' : isVideo ? 'VIDEO' : 'IMAGE');

    const uploaded = await this.uploadsService.create(user, file);
    const id = randomUUID();

    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "media_store" (
        "id", "uploadedById", "cropId", "fileUrl", "mediaType", "mimeType", 
        "originalName", "sizeBytes", "provider", "storagePath", "expiresAt", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP + INTERVAL '7 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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
      (uploaded as any).storageKey || `crops/${uploaded.originalName}`,
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
    await this.assertCropAccess(user, cropId);
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
        "originalName", "sizeBytes", "provider", "storagePath", "expiresAt", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP + INTERVAL '7 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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
      (uploaded as any).storageKey || `crops/${uploaded.originalName}`,
    );

    const rows: any = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM "media_store" WHERE "id" = $1 LIMIT 1`,
      id,
    );

    return rows[0];
  }

  /**
   * Retrieve Media Store items for a given crop (`scope = 'active'` filters to 7-day display window)
   */
  async getMediaForCrop(user: AuthUser, cropId: string, scope: 'active' | 'all' = 'all'): Promise<MediaStoreRecord[]> {
    await this.assertCropAccess(user, cropId);
    const filterActive =
      scope === 'active'
        ? ` AND COALESCE("expiresAt", "createdAt" + INTERVAL '7 days') > CURRENT_TIMESTAMP`
        : '';
    const rows: any = await this.prisma.$queryRawUnsafe(
      `
      SELECT * FROM "media_store"
      WHERE "cropId" = $1${filterActive}
      ORDER BY "createdAt" DESC
      `,
      cropId,
    );
    return rows;
  }

  private async ensureCropRemarksTable() {
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

  /**
   * Retrieve farmer's active 7-day written crop remark plus complete historical remarks for Crop Activities
   */
  async getCropRemark(user: AuthUser, cropId: string): Promise<{
    cropId: string;
    remarksText: string;
    createdAt: Date | null;
    expiresAt: Date | null;
    isActiveDisplay: boolean;
    history: Array<{ id: string; remarksText: string; createdAt: Date; expiresAt: Date; isActiveDisplay: boolean }>;
  }> {
    await this.assertCropAccess(user, cropId);
    await this.ensureCropRemarksTable();
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `
      SELECT "id", "remarksText", "createdAt", "expiresAt"
      FROM "crop_remarks_history"
      WHERE "cropId" = $1
      ORDER BY "createdAt" DESC
      `,
      cropId,
    );

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

  /**
   * Save farmer's written crop remark (max 150 chars, 7-day active display + archived permanently in Crop Activities)
   */
  async saveCropRemark(
    user: AuthUser,
    cropId: string,
    rawRemarksText: string,
  ) {
    await this.assertCropAccess(user, cropId);
    await this.ensureCropRemarksTable();
    const trimmed = String(rawRemarksText || '').trim().slice(0, 150);

    if (!trimmed) {
      await this.prisma.$executeRawUnsafe(
        `DELETE FROM "crop_remarks_history" WHERE "cropId" = $1 AND "expiresAt" > CURRENT_TIMESTAMP`,
        cropId,
      );
      return this.getCropRemark(user, cropId);
    }

    const id = randomUUID();
    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "crop_remarks_history" ("id", "cropId", "uploadedById", "remarksText", "createdAt", "expiresAt")
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days')
      `,
      id,
      cropId,
      user.id,
      trimmed,
    );

    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "crop_remarks" ("cropId", "uploadedById", "remarksText", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("cropId") DO UPDATE SET
        "uploadedById" = EXCLUDED."uploadedById",
        "remarksText" = EXCLUDED."remarksText",
        "updatedAt" = CURRENT_TIMESTAMP
      `,
      cropId,
      user.id,
      trimmed,
    );

    return this.getCropRemark(user, cropId);
  }

  /**
   * List all items from Media Store with filters
   */
  async listAll(
    user: AuthUser,
    cropId?: string,
    mediaType?: string,
    provider?: string,
    limit = 50,
  ): Promise<MediaStoreRecord[]> {
    if (cropId) {
      await this.assertCropAccess(user, cropId);
    }
    let query = `SELECT * FROM "media_store" WHERE 1=1`;
    const params: any[] = [];

    if (!this.isStaffAdmin(user) && !cropId) {
      params.push(user.id);
      query += ` AND "uploadedById" = $${params.length}`;
    }
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

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    params.push(safeLimit);
    query += ` ORDER BY "createdAt" DESC LIMIT $${params.length}`;

    const rows: any = await this.prisma.$queryRawUnsafe(query, ...params);
    return rows;
  }

  /**
   * Set 30-day retention countdown when crop is marked completed
   */
  async archiveCropMedia(user: AuthUser, cropId: string, retentionDays = 30): Promise<{ updatedCount: number }> {
    await this.assertCropAccess(user, cropId);
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
    const rows: any = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM "media_store" WHERE "id" = $1 LIMIT 1`,
      id,
    );
    const existing = rows?.[0];
    if (!existing) {
      throw new NotFoundException('Media record not found.');
    }

    if (!this.isStaffAdmin(user) && existing.uploadedById !== user.id) {
      if (existing.cropId) {
        await this.assertCropAccess(user, existing.cropId);
      } else {
        throw new ForbiddenException('You do not have permission to delete this media item.');
      }
    }

    await this.prisma.$executeRawUnsafe(
      `DELETE FROM "media_store" WHERE "id" = $1`,
      id,
    );

    if (existing.provider === 'LOCAL' && existing.storagePath) {
      const localFile = path.resolve(process.cwd(), 'uploads', existing.storagePath);
      if (localFile.startsWith(path.resolve(process.cwd(), 'uploads')) && fs.existsSync(localFile)) {
        try {
          fs.unlinkSync(localFile);
        } catch {
          // ignore local file unlink error
        }
      }
    }

    return { success: true };
  }
}

