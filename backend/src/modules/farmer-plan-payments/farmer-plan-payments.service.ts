import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, PlanPaymentStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdvisorAssignmentService } from '../advisor-assignment/advisor-assignment.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { FarmerPlansService, PLAN_RANK } from '../farmer-plans/farmer-plans.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { hasActiveRole } from '../../common/utils/auth-user.util';
import { buildUpiPaymentLink } from '../../common/utils/upi.util';
import { InitiateFarmerPlanPaymentDto } from './dto/initiate-farmer-plan-payment.dto';
import { SubmitFarmerPlanPaymentDto } from './dto/submit-farmer-plan-payment.dto';
import { RejectFarmerPlanPaymentDto } from './dto/reject-farmer-plan-payment.dto';

const DETAIL_INCLUDE = {
  farmer: { select: { id: true, name: true, mobile: true, kingId: true } },
} as const;

@Injectable()
export class FarmerPlanPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly advisorAssignmentService: AdvisorAssignmentService,
    private readonly notificationsService: NotificationsService,
    private readonly appSettingsService: AppSettingsService,
    private readonly farmerPlansService: FarmerPlansService,
  ) {}

  /** Farmer (or their advisor) taps "Upgrade" and picks BASIC/STANDARD/PREMIUM — generates a fixed-amount UPI link and opens a pending payment claim. */
  async initiate(user: AuthUser, dto: InitiateFarmerPlanPaymentDto, farmerId?: string) {
    const targetFarmerId = farmerId ?? (hasActiveRole(user, Role.FARMER) ? user.id : undefined);
    if (!targetFarmerId) {
      throw new BadRequestException('A farmer must be specified to start a payment.');
    }
    if (hasActiveRole(user, Role.ADVISOR) && targetFarmerId !== user.id) {
      await this.advisorAssignmentService.assertAdvisorAssignedToFarmerAnyExpiry(user.id, targetFarmerId);
    }

    const farmer = await this.prisma.user.findFirst({ where: { id: targetFarmerId, roles: { has: Role.FARMER }, deletedAt: null } });
    if (!farmer) {
      throw new NotFoundException('Farmer not found.');
    }

    const effective = await this.farmerPlansService.getEffectivePlan(targetFarmerId);
    if (PLAN_RANK[dto.targetPlan] < PLAN_RANK[effective.plan]) {
      throw new BadRequestException(`You already have the ${effective.plan} plan active — this would be a downgrade.`);
    }

    const pricing = await this.prisma.farmerPlanPricing.findUnique({ where: { plan: dto.targetPlan } });
    if (!pricing) {
      throw new BadRequestException('Pricing for this plan is not configured yet. Please contact support.');
    }

    const amount = Number(pricing.price);
    const daysGranted = pricing.billingPeriodDays;

    const request = await this.prisma.farmerPlanPaymentRequest.create({
      data: { farmerId: targetFarmerId, targetPlan: dto.targetPlan, amount, daysGranted },
      include: DETAIL_INCLUDE,
    });

    const settings = await this.appSettingsService.get();
    if (!settings.upiId) {
      throw new BadRequestException('UPI payment is not configured yet. Please contact support.');
    }
    const upiLink = buildUpiPaymentLink({
      amount,
      note: farmer.kingId ?? farmer.id,
      transactionRef: request.id,
      payeeVpa: settings.upiId,
      payeeName: settings.upiPayeeName ?? undefined,
    });
    return { ...request, upiLink };
  }

  listMine(user: AuthUser) {
    return this.prisma.farmerPlanPaymentRequest.findMany({
      where: { farmerId: user.id },
      include: DETAIL_INCLUDE,
      orderBy: { requestedAt: 'desc' },
    });
  }

  private async findOwnedOrThrow(user: AuthUser, id: string) {
    const request = await this.prisma.farmerPlanPaymentRequest.findUnique({ where: { id }, include: DETAIL_INCLUDE });
    if (!request) {
      throw new NotFoundException('Payment request not found.');
    }
    const isOwner = request.farmerId === user.id;
    const staffRoles: Role[] = [Role.ADMIN, Role.SUPER_ADMIN];
    if (!isOwner && !staffRoles.includes(user.role)) {
      if (user.role === Role.ADVISOR) {
        await this.advisorAssignmentService.assertAdvisorAssignedToFarmerAnyExpiry(user.id, request.farmerId);
      } else {
        throw new ForbiddenException('You do not have access to this payment request.');
      }
    }
    return request;
  }

  /** Farmer/advisor claims the UPI payment was made; puts it in the admin review queue. */
  async submit(user: AuthUser, id: string, dto: SubmitFarmerPlanPaymentDto) {
    const request = await this.findOwnedOrThrow(user, id);
    if (request.status !== PlanPaymentStatus.PENDING) {
      throw new BadRequestException('This payment request has already been submitted or resolved.');
    }

    const updated = await this.prisma.farmerPlanPaymentRequest.update({
      where: { id },
      data: { status: PlanPaymentStatus.SUBMITTED, submittedAt: new Date(), utr: dto.utr },
      include: DETAIL_INCLUDE,
    });

    const admins = await this.prisma.user.findMany({ where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] }, deletedAt: null }, select: { id: true } });
    await Promise.all(
      admins.map((admin) =>
        this.notificationsService.create(
          admin.id,
          NotificationType.PAYMENT_DUE,
          'Plan upgrade payment awaiting verification',
          `${request.farmer.name} claims ₹${request.amount} was paid to upgrade to ${request.targetPlan}. Please verify and confirm.`,
          { farmerPlanPaymentRequestId: id },
        ),
      ),
    );

    return updated;
  }

  /** Admin queue of claims awaiting verification. */
  listPending() {
    return this.prisma.farmerPlanPaymentRequest.findMany({
      where: { status: PlanPaymentStatus.SUBMITTED },
      include: DETAIL_INCLUDE,
      orderBy: { submittedAt: 'asc' },
    });
  }

  /** Admin has verified the UPI payment manually and confirms it — applies the plan upgrade/extension. */
  async confirm(admin: AuthUser, id: string) {
    const request = await this.prisma.farmerPlanPaymentRequest.findUnique({ where: { id }, include: DETAIL_INCLUDE });
    if (!request) {
      throw new NotFoundException('Payment request not found.');
    }
    if (request.status !== PlanPaymentStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted payment requests can be confirmed.');
    }

    const result = await this.farmerPlansService.applyPlanChange(request.farmerId, request.targetPlan, request.daysGranted);

    const updated = await this.prisma.farmerPlanPaymentRequest.update({
      where: { id },
      data: { status: PlanPaymentStatus.CONFIRMED, confirmedAt: new Date(), confirmedById: admin.id },
      include: DETAIL_INCLUDE,
    });

    await this.notificationsService.create(
      request.farmerId,
      NotificationType.SYSTEM,
      'Payment confirmed',
      `Your payment of ₹${request.amount} was confirmed. ${result.plan.plan} plan active until ${result.newEndDate.toLocaleDateString('en-IN')}.${result.advisorHired ? ' A Farm Advisor has been assigned to you.' : ''}`,
      { farmerPlanPaymentRequestId: id },
    );

    return { request: updated, ...result };
  }

  /** Admin rejects a claim (e.g. no matching UPI transaction found). */
  async reject(admin: AuthUser, id: string, dto: RejectFarmerPlanPaymentDto) {
    const request = await this.prisma.farmerPlanPaymentRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException('Payment request not found.');
    }
    if (request.status !== PlanPaymentStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted payment requests can be rejected.');
    }

    const updated = await this.prisma.farmerPlanPaymentRequest.update({
      where: { id },
      data: { status: PlanPaymentStatus.REJECTED, rejectedAt: new Date(), rejectionReason: dto.reason },
      include: DETAIL_INCLUDE,
    });

    await this.notificationsService.create(
      request.farmerId,
      NotificationType.SYSTEM,
      'Payment could not be verified',
      dto.reason ?? 'We could not verify your UPI payment. Please try again or contact support.',
      { farmerPlanPaymentRequestId: id },
    );

    return updated;
  }
}
