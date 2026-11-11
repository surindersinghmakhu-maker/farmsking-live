import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    let retries = 5;
    while (retries > 0) {
      try {
        await this.$connect();
        this.logger.log('Successfully connected to database.');

        // Auto-heal missing DB columns on production PostgreSQL without needing manual SSH migration scripts
        try {
          await this.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "googleId" TEXT;`);
          await this.$executeRawUnsafe(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'users_googleId_key') THEN CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId"); END IF; END $$;`);
          await this.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "supervisorFeaturesConfig" JSONB DEFAULT '{}'::jsonb;`);
          await this.$executeRawUnsafe(`ALTER TABLE "seller_stores" ADD COLUMN IF NOT EXISTS "categoryCommissions" JSONB DEFAULT '{}'::jsonb;`);
          await this.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "supervisor_requests" (
              "id" TEXT NOT NULL PRIMARY KEY,
              "farmerId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
              "supervisorId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
              "status" TEXT NOT NULL DEFAULT 'PENDING',
              "featuresConfig" JSONB NOT NULL DEFAULT '{}'::jsonb,
              "note" TEXT,
              "respondedAt" TIMESTAMP WITH TIME ZONE,
              "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
          `);
          await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "supervisor_requests_farmerId_idx" ON "supervisor_requests"("farmerId");`);
          await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "supervisor_requests_supervisorId_idx" ON "supervisor_requests"("supervisorId");`);
          await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "supervisor_requests_status_idx" ON "supervisor_requests"("status");`);

          // Auto-migration: Media Store table for external cloud/local photos and videos
          await this.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "media_store" (
              "id" TEXT NOT NULL PRIMARY KEY,
              "uploadedById" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
              "cropId" TEXT,
              "fileUrl" TEXT NOT NULL,
              "thumbnailUrl" TEXT,
              "mediaType" TEXT NOT NULL DEFAULT 'IMAGE',
              "mimeType" TEXT NOT NULL,
              "originalName" TEXT NOT NULL,
              "sizeBytes" INTEGER NOT NULL DEFAULT 0,
              "provider" TEXT NOT NULL DEFAULT 'CLOUDFLARE_R2',
              "bucketName" TEXT,
              "storagePath" TEXT,
              "isArchived" BOOLEAN NOT NULL DEFAULT false,
              "archivedAt" TIMESTAMP WITH TIME ZONE,
              "expiresAt" TIMESTAMP WITH TIME ZONE,
              "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
          `);
          await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "media_store_uploadedById_idx" ON "media_store"("uploadedById");`);
          await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "media_store_cropId_idx" ON "media_store"("cropId");`);
          await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "media_store_provider_idx" ON "media_store"("provider");`);

          // Auto-migration: Crop written feedback / remarks (max 150 chars, 7-day display window + permanent history)
          await this.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "crop_remarks" (
              "cropId" TEXT NOT NULL PRIMARY KEY,
              "uploadedById" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
              "remarksText" TEXT NOT NULL DEFAULT '',
              "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
          `);
          await this.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "crop_remarks_history" (
              "id" TEXT NOT NULL PRIMARY KEY,
              "cropId" TEXT NOT NULL,
              "uploadedById" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
              "remarksText" TEXT NOT NULL DEFAULT '',
              "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days')
            );
          `);
          await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "crop_remarks_history_cropId_idx" ON "crop_remarks_history"("cropId");`);

          // Auto-migration: Ensure all non-admin users who possess a King ID have the 'CUSTOMER' role in their roles array
          await this.$executeRawUnsafe(`
            UPDATE "users"
            SET "roles" = array_append("roles", 'CUSTOMER'::"Role")
            WHERE "kingId" IS NOT NULL
              AND "role" NOT IN ('ADMIN', 'SUPER_ADMIN')
              AND NOT ('CUSTOMER'::"Role" = ANY("roles"));
          `);

          this.logger.log('Auto-migration checked for users.googleId, supervisorFeaturesConfig, supervisor_requests, and kingId CUSTOMER role baseline.');
        } catch (migErr) {
          this.logger.warn(`Auto-migration check notice: ${migErr.message}`);
        }

        break;
      } catch (err) {
        this.logger.warn(`Failed to connect to database. Retries left: ${retries - 1}`);
        retries -= 1;
        if (retries === 0) {
          this.logger.error('Could not connect to database after retries. Proceeding with lazy connect...');
          break; // Don't crash, let Prisma lazy-connect on first query
        }
        await new Promise((res) => setTimeout(res, 3000));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
