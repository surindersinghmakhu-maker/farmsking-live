import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { CashfreeService } from './cashfree.service';
import { CashfreeController } from './cashfree.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [CashfreeController],
  providers: [CashfreeService],
  exports: [CashfreeService],
})
export class CashfreeModule {}
