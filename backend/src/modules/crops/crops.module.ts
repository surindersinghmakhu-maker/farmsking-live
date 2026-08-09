import { Module } from '@nestjs/common';
import { PlotsModule } from '../plots/plots.module';
import { CropsController } from './crops.controller';
import { CropsService } from './crops.service';

@Module({
  imports: [PlotsModule],
  controllers: [CropsController],
  providers: [CropsService],
  exports: [CropsService],
})
export class CropsModule {}
