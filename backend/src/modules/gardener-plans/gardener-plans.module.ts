import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AppSettingsModule } from '../app-settings/app-settings.module';
import { CashfreeModule } from '../cashfree/cashfree.module';
import { GardenerPlansService } from './gardener-plans.service';
import { GardenerPlansController } from './gardener-plans.controller';

@Module({
  imports: [PrismaModule, AppSettingsModule, CashfreeModule],
  controllers: [GardenerPlansController],
  providers: [GardenerPlansService],
  exports: [GardenerPlansService],
})
export class GardenerPlansModule {}
