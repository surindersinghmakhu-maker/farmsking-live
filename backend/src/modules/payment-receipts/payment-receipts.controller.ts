import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { PaymentReceiptsService } from './payment-receipts.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FARMER)
@Controller('payment-receipts')
export class PaymentReceiptsController {
  constructor(private readonly paymentReceiptsService: PaymentReceiptsService) {}

  @Get('count/mine')
  countMine(@CurrentUser() user: AuthUser) {
    return this.paymentReceiptsService.countMine(user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.paymentReceiptsService.findOneOrThrow(user, id);
  }
}
