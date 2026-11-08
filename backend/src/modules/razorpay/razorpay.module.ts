import { Module } from '@nestjs/common';
import { RazorpayService } from './razorpay.service';
import { RazorpayController } from './razorpay.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AppSettingsModule } from '../app-settings/app-settings.module';

@Module({
  imports: [PrismaModule, AppSettingsModule],
  controllers: [RazorpayController],
  providers: [RazorpayService],
  exports: [RazorpayService],
})
export class RazorpayModule {}

