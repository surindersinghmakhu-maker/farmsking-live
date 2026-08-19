import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdvisorAssignmentModule } from '../advisor-assignment/advisor-assignment.module';
import { WalletModule } from '../wallet/wallet.module';
import { FarmerPlansService } from './farmer-plans.service';
import { FarmerPlansController } from './farmer-plans.controller';

@Module({
  imports: [PrismaModule, AdvisorAssignmentModule, WalletModule],
  controllers: [FarmerPlansController],
  providers: [FarmerPlansService],
  exports: [FarmerPlansService],
})
export class FarmerPlansModule {}
