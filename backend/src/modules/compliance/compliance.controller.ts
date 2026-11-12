import { Body, Controller, Get, Header, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { ComplianceService } from './compliance.service';
import { CreateComplianceRecordDto, UpdateComplianceRecordDto } from './dto/compliance-record.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT)
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  /** Full Financial, GST, TDS, KYC & Gateway Readiness Summary for CA, Accountant & Advocate */
  @Get('ca-summary')
  getCaSummary() {
    return this.complianceService.getCaSummary();
  }

  /** CA Downloadable Monthly GSTR-8 CSV (Section 52 TCS @ 0.5%) */
  @Get('gstr8-csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="farmsking-gstr8.csv"')
  exportGstr8Csv(
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const now = new Date();
    const m = Math.min(12, Math.max(1, parseInt(month || String(now.getMonth() + 1), 10) || 1));
    const y = Math.min(2100, Math.max(2020, parseInt(year || String(now.getFullYear()), 10) || now.getFullYear()));
    return this.complianceService.exportGstr8Csv(m, y);
  }

  /** CA Downloadable Income Tax TDS Register CSV (Form 26Q) */
  @Get('tds-csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="farmsking-tds-register.csv"')
  exportTdsCsv(@Query('section') section?: string) {
    return this.complianceService.exportTdsCsv(section);
  }

  /** Advocate Statutory Filings, Licenses & Legal Register */
  @Get('records')
  listRecords() {
    return this.complianceService.listRecords();
  }

  /** Create Statutory / Government Filing Task */
  @Post('records')
  createRecord(@CurrentUser() user: AuthUser, @Body() dto: CreateComplianceRecordDto) {
    return this.complianceService.createRecord(user, dto);
  }

  /** Update Statutory Filing Status, SRN/Challan Reference, Due Date or Proof */
  @Patch('records/:id')
  updateRecord(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateComplianceRecordDto,
  ) {
    return this.complianceService.updateRecord(user, id, dto);
  }
}

