import { Module } from '@nestjs/common';
import { SprayItemTemplatesController } from './spray-item-templates.controller';
import { SprayItemTemplatesService } from './spray-item-templates.service';

@Module({
  controllers: [SprayItemTemplatesController],
  providers: [SprayItemTemplatesService],
})
export class SprayItemTemplatesModule {}
