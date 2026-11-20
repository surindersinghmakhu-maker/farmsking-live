import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { MarketRatesService } from './market-rates.service';

@UseGuards(OptionalJwtAuthGuard)
@Controller('market-rates')
export class MarketRatesController {
  constructor(private readonly marketRatesService: MarketRatesService) {}

  @Get('my-crops')
  getMyCropRates(@CurrentUser() user?: AuthUser | null) {
    return this.marketRatesService.getMyCropRates(user);
  }

  @Get('widget-summary')
  getWidgetSummary(
    @Query('crop') cropName?: string,
    @Query('state') state?: string,
    @Query('unit') unit?: string,
  ) {
    return this.marketRatesService.getCropWidgetSummary(cropName || 'Marigold', state || 'Punjab', unit || 'KG');
  }

  @Get('summary')
  getSummary(
    @Query('crop') cropName?: string,
    @Query('state') state?: string,
    @Query('unit') unit?: string,
  ) {
    return this.marketRatesService.getCropWidgetSummary(cropName || 'Wheat', state || 'Punjab', unit || 'QUINTAL');
  }
}

