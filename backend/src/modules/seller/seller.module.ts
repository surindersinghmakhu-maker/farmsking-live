import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ShiprocketModule } from '../shiprocket/shiprocket.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SellerService } from './seller.service';
import { SellerController } from './seller.controller';

@Module({
  imports: [PrismaModule, ShiprocketModule, NotificationsModule],
  controllers: [SellerController],
  providers: [SellerService],
  exports: [SellerService],
})
export class SellerModule {}

