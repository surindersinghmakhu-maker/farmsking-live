import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { PartnerAssignmentService } from './partner-assignment.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('partner-assignments')
export class PartnerAssignmentController {
  constructor(private readonly partnerAssignmentService: PartnerAssignmentService) {}

  @Roles(Role.CUSTOMER)
  @Get('my-partner')
  findMyPartner(@CurrentUser() user: AuthUser) {
    return this.partnerAssignmentService.findMyPartner(user);
  }

  @Roles(Role.BUSINESS_PARTNER)
  @Get('customers')
  findMyCustomers(@CurrentUser() user: AuthUser) {
    return this.partnerAssignmentService.findMyCustomers(user);
  }
}
