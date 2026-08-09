import { Module } from '@nestjs/common';
import { MarketRatesController } from './market-rates.controller';
import { MarketRatesService } from './market-rates.service';

@Module({
  controllers: [MarketRatesController],
  providers: [MarketRatesService],
})
export class MarketRatesModule {}
