import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { Role } from '@prisma/client';
import { TrainersService } from './trainers.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trainers')
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

  /** Technical Trainer: Get list of assigned farmers for welcome calls */
  @Roles(Role.TECHNICAL_TRAINER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get('my-assigned-farmers')
  getMyAssignedFarmers(@CurrentUser() user: AuthUser) {
    return this.trainersService.getMyAssignedFarmers(user);
  }

  /** Technical Trainer: Send 4-digit training verification code via WhatsApp to Farmer */
  @Roles(Role.TECHNICAL_TRAINER, Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @Post('send-verification-code')
  sendVerificationCode(@CurrentUser() user: AuthUser, @Body() body: { farmerId: string }) {
    return this.trainersService.sendVerificationCode(user, body.farmerId);
  }

  /** Technical Trainer: Enter 4-digit code to verify training and claim wallet reward */
  @Roles(Role.TECHNICAL_TRAINER, Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @Post('verify-code')
  verifyTrainingWithCode(
    @CurrentUser() user: AuthUser,
    @Body() body: { farmerId: string; code: string; notes?: string },
  ) {
    return this.trainersService.verifyTrainingWithCode(user, body.farmerId, body.code, body.notes);
  }

  /** Farmer: Check if current farmer has a pending training confirmation banner */
  @Roles(Role.FARMER, Role.CUSTOMER, Role.GARDENER, Role.TECHNICAL_TRAINER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get('farmer-pending-banner')
  getFarmerPendingTrainingBanner(@CurrentUser() user: AuthUser) {
    return this.trainersService.getFarmerPendingTrainingBanner(user);
  }

  /** Farmer: Submit 1-5 Star Rating & Complete Training Confirmation */
  @Roles(Role.FARMER, Role.CUSTOMER, Role.GARDENER, Role.TECHNICAL_TRAINER, Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @Post('farmer-verify')
  farmerInAppVerify(
    @CurrentUser() user: AuthUser,
    @Body() body: { rating: number; notes?: string },
  ) {
    return this.trainersService.farmerInAppVerify(user, body.rating, body.notes);
  }

  /** Admin: Assign Technical Trainer to State/District with custom commission rate */
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('assignments')
  assignTrainerState(
    @CurrentUser() user: AuthUser,
    @Body() body: { trainerId: string; state: string; district?: string; commissionRate?: number },
  ) {
    return this.trainersService.assignTrainerState(
      user,
      body.trainerId,
      body.state,
      body.district,
      body.commissionRate,
    );
  }

  /** Admin: List all Technical Trainer State assignments */
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('assignments')
  listTrainerAssignments() {
    return this.trainersService.listTrainerAssignments();
  }
}
