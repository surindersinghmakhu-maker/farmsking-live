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
          this.logger.log('Auto-migration checked for users.googleId column.');
        } catch (migErr) {
          this.logger.warn(`Auto-migration for googleId: ${migErr.message}`);
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
