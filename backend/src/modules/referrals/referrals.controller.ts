import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { ReferralsService } from './referrals.service';

export class LinkReferralDto {
  referrerKingId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  /** Get user's Farm Network Circle & Lifetime Royalties summary */
  @Get('my-network')
  getMyReferralNetwork(@CurrentUser() user: AuthUser) {
    return this.referralsService.getMyReferralNetwork(user);
  }

  /** Link user to referrer during/after sign up */
  @Post('link')
  linkReferralOnSignUp(@CurrentUser() user: AuthUser, @Body() dto: LinkReferralDto) {
    return this.referralsService.linkReferralOnSignUp(user.id, dto.referrerKingId);
  }
}
