import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { ShiprocketService } from './shiprocket.service';
import { ShiprocketController } from './shiprocket.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [ShiprocketController],
  providers: [ShiprocketService],
  exports: [ShiprocketService],
})
export class ShiprocketModule {}
