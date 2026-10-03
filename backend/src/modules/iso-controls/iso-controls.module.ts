import { Module } from '@nestjs/common';
import { IsoControlsService } from './iso-controls.service';
import { IsoControlsController } from './iso-controls.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [IsoControlsService],
  controllers: [IsoControlsController],
  exports: [IsoControlsService],
})
export class IsoControlsModule {}
