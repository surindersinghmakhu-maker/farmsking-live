import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { CreatePriceLockDto, MandiAIService } from './mandi-ai.service';

@UseGuards(JwtAuthGuard)
@Controller('mandi-ai')
export class MandiAIController {
  constructor(private readonly mandiAIService: MandiAIService) {}

  @Get('predictions')
  get30DayPricePrediction(
    @Query('cropName') cropName?: string,
    @Query('mandiName') mandiName?: string,
  ) {
    return this.mandiAIService.get30DayPricePrediction(cropName, mandiName);
  }

  @Post('price-lock')
  createPriceLockContract(@CurrentUser() user: AuthUser, @Body() dto: CreatePriceLockDto) {
    return this.mandiAIService.createPriceLockContract(user, dto);
  }

  @Get('price-locks')
  getMyPriceLockContracts(@CurrentUser() user: AuthUser) {
    return this.mandiAIService.getMyPriceLockContracts(user);
  }
}
