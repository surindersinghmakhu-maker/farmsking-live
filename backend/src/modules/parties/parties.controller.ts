import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PartyRole, Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { PartiesService } from './parties.service';
import { CreatePartyDto } from './dto/create-party.dto';
import { RecordSaleLedgerDto } from './dto/record-sale-ledger.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { CreateUnifiedPartyDto } from './dto/create-unified-party.dto';
import { RecordArhtiyaAdvanceDto } from './dto/record-arhtiya-advance.dto';
import { RecordArhtiyaCropSaleDto } from './dto/record-arhtiya-crop-sale.dto';


@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FARMER, Role.LABOUR, Role.ADMIN, Role.SUPER_ADMIN)
@Controller('parties')
export class PartiesController {
  constructor(private readonly partiesService: PartiesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePartyDto) {
    return this.partiesService.create(user, dto.name, dto.address, dto.mobile);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: { name?: string; address?: string; mobile?: string }) {
    return this.partiesService.update(user, id, dto);
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

  // ─── Unified Party System & King ID Endpoints ──────────────────────────────

  @Post('unified')
  createUnifiedParty(@CurrentUser() user: AuthUser, @Body() dto: CreateUnifiedPartyDto) {
    return this.partiesService.createUnifiedParty(user, dto);
  }

  @Get('unified')
  listUnifiedParties(@CurrentUser() user: AuthUser, @Query('role') role?: PartyRole) {
    return this.partiesService.listUnifiedParties(user, role);
  }

  // ─── Arhtiya Management Module Endpoints ─────────────────────────────────

  @Post('arhtiya/advance')
  recordArhtiyaAdvance(@CurrentUser() user: AuthUser, @Body() dto: RecordArhtiyaAdvanceDto) {
    return this.partiesService.recordArhtiyaAdvance(user, dto);
  }

  @Post('arhtiya/crop-sale')
  recordArhtiyaCropSale(@CurrentUser() user: AuthUser, @Body() dto: RecordArhtiyaCropSaleDto) {
    return this.partiesService.recordArhtiyaCropSale(user, dto);
  }

  @Get('arhtiya/:id/hisab')
  getArhtiyaLedgerHisab(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.partiesService.getArhtiyaLedgerHisab(user, id);
  }
}

