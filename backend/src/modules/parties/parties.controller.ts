import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { PartiesService } from './parties.service';
import { CreatePartyDto } from './dto/create-party.dto';
import { RecordSaleLedgerDto } from './dto/record-sale-ledger.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FARMER)
@Controller('parties')
export class PartiesController {
  constructor(private readonly partiesService: PartiesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePartyDto) {
    return this.partiesService.create(user, dto.name, dto.address, dto.mobile);
  }

  @Get()
  listMine(@CurrentUser() user: AuthUser) {
    return this.partiesService.listMine(user);
  }

  @Get(':id/statement')
  getStatement(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.partiesService.getStatement(user, id);
  }

  @Post(':id/ledger/sale')
  recordSaleLedger(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: RecordSaleLedgerDto) {
    return this.partiesService.recordSaleLedger(user, id, dto);
  }

  @Post(':id/ledger/payment-received')
  recordPaymentReceived(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: RecordPaymentDto) {
    return this.partiesService.recordPaymentReceived(user, id, dto);
  }

  @Post(':id/ledger/payment-made')
  recordPaymentMade(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: RecordPaymentDto) {
    return this.partiesService.recordPaymentMade(user, id, dto);
  }
}
