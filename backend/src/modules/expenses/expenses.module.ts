import { Module } from '@nestjs/common';
import { FarmsModule } from '../farms/farms.module';
import { PlotsModule } from '../plots/plots.module';
import { CropsModule } from '../crops/crops.module';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

@Module({
  imports: [FarmsModule, PlotsModule, CropsModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
