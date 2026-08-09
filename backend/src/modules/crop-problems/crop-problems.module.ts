import { Module } from '@nestjs/common';
import { CropsModule } from '../crops/crops.module';
import { CropProblemsController } from './crop-problems.controller';
import { CropProblemsService } from './crop-problems.service';

@Module({
  imports: [CropsModule],
  controllers: [CropProblemsController],
  providers: [CropProblemsService],
  exports: [CropProblemsService],
})
export class CropProblemsModule {}
