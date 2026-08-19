import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GardenerPlansService } from './gardener-plans.service';
import { GardenerPlansController } from './gardener-plans.controller';

@Module({
  imports: [PrismaModule],
  controllers: [GardenerPlansController],
  providers: [GardenerPlansService],
  exports: [GardenerPlansService],
})
export class GardenerPlansModule {}
