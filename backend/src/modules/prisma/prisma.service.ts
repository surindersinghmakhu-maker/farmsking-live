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
