import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { MarketRatesService } from './market-rates.service';

@UseGuards(JwtAuthGuard)
@Controller('market-rates')
export class MarketRatesController {
  constructor(private readonly marketRatesService: MarketRatesService) {}

  @Get('my-crops')
  getMyCropRates(@CurrentUser() user: AuthUser) {
    return this.marketRatesService.getMyCropRates(user);
  }
}
