import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NurseryController } from './nursery.controller';
import { NurseryService } from './nursery.service';

@Module({
  imports: [PrismaModule],
  controllers: [NurseryController],
  providers: [NurseryService],
  exports: [NurseryService],
})
export class NurseryModule {}

