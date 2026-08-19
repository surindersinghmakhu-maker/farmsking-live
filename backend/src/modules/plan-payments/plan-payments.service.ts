import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, PlanPaymentStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdvisorAssignmentService } from '../advisor-assignment/advisor-assignment.service';
import { PlanRenewalService } from '../plan-renewal/plan-renewal.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { hasActiveRole } from '../../common/utils/auth-user.util';
import { buildUpiPaymentLink } from '../../common/utils/upi.util';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { SubmitPlanPaymentDto } from './dto/submit-plan-payment.dto';
import { RejectPlanPaymentDto } from './dto/reject-plan-payment.dto';

const DETAIL_INCLUDE = {
  farmer: { select: { id: true, name: true, mobile: true, kingId: true } },
  subscription: { include: { plan: true } },
} as const;

/** Billing cycle string on AdvisorPlan doesn't carry a day count, so we map it here. */
function cycleDays(billingCycle: string): number {
  return billingCycle === 'YEARLY' ? 365 : 30;
}

@Injectable()
export class PlanPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly advisorAssignmentService: AdvisorAssignmentService,
    private readonly planRenewalService: PlanRenewalService,
    private readonly notificationsService: NotificationsService,
    private readonly appSettingsService: AppSettingsService,
  ) {}

  /** Farmer taps "Renew" — generates a fixed-amount UPI link and opens a pending payment claim. */
  async initiate(user: AuthUser, farmerId?: string) {
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

    const subscription = await this.prisma.advisorSubscription.findFirst({
      where: { farmerId: targetFarmerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
    if (!subscription) {
      throw new BadRequestException('This farmer has no plan to pay for yet.');
    }

    const remark = farmer.kingId ?? farmer.id;
    const amount = Number(subscription.plan.price);
    const daysGranted = cycleDays(subscription.plan.billingCycle);

    const request = await this.prisma.planPaymentRequest.create({
      data: { farmerId: targetFarmerId, subscriptionId: subscription.id, amount, daysGranted },
      include: DETAIL_INCLUDE,
    });

    const settings = await this.appSettingsService.get();
    if (!settings.upiId) {
      throw new BadRequestException('UPI payment is not configured yet. Please contact support.');
    }
    const upiLink = buildUpiPaymentLink({
      amount,
      note: remark,
      transactionRef: request.id,
      payeeVpa: settings.upiId,
      payeeName: settings.upiPayeeName ?? undefined,
    });
    return { ...request, upiLink };
  }

  listMine(user: AuthUser) {
    return this.prisma.planPaymentRequest.findMany({
      where: { farmerId: user.id },
      include: DETAIL_INCLUDE,
      orderBy: { requestedAt: 'desc' },
    });
  }

  private async findOwnedOrThrow(user: AuthUser, id: string) {
    const request = await this.prisma.planPaymentRequest.findUnique({ where: { id }, include: DETAIL_INCLUDE });
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
  async submit(user: AuthUser, id: string, dto: SubmitPlanPaymentDto) {
    const request = await this.findOwnedOrThrow(user, id);
    if (request.status !== PlanPaymentStatus.PENDING) {
      throw new BadRequestException('This payment request has already been submitted or resolved.');
    }

    const updated = await this.prisma.planPaymentRequest.update({
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
          'Plan payment awaiting verification',
          `${request.farmer.name} claims ₹${request.amount} was paid for their plan. Please verify and confirm.`,
          { planPaymentRequestId: id },
        ),
      ),
    );

    return updated;
  }

  /** Admin queue of claims awaiting verification. */
  listPending() {
    return this.prisma.planPaymentRequest.findMany({
      where: { status: PlanPaymentStatus.SUBMITTED },
      include: DETAIL_INCLUDE,
      orderBy: { submittedAt: 'asc' },
    });
  }

  /** Admin has verified the UPI payment manually and confirms it — extends the farmer's plan. */
  async confirm(admin: AuthUser, id: string) {
    const request = await this.prisma.planPaymentRequest.findUnique({ where: { id }, include: DETAIL_INCLUDE });
    if (!request) {
      throw new NotFoundException('Payment request not found.');
    }
    if (request.status !== PlanPaymentStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted payment requests can be confirmed.');
    }

    const { newEndDate } = await this.planRenewalService.grantDaysDirectly(request.farmerId, request.daysGranted);

    const updated = await this.prisma.planPaymentRequest.update({
      where: { id },
      data: { status: PlanPaymentStatus.CONFIRMED, confirmedAt: new Date(), confirmedById: admin.id },
      include: DETAIL_INCLUDE,
    });

    await this.notificationsService.create(
      request.farmerId,
      NotificationType.SYSTEM,
      'Payment confirmed',
      `Your payment of ₹${request.amount} was confirmed. Plan extended to ${newEndDate.toLocaleDateString('en-IN')}.`,
      { planPaymentRequestId: id },
    );

    return { request: updated, newEndDate };
  }

  /** Admin rejects a claim (e.g. no matching UPI transaction found). */
  async reject(admin: AuthUser, id: string, dto: RejectPlanPaymentDto) {
    const request = await this.prisma.planPaymentRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException('Payment request not found.');
    }
    if (request.status !== PlanPaymentStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted payment requests can be rejected.');
    }

    const updated = await this.prisma.planPaymentRequest.update({
      where: { id },
      data: { status: PlanPaymentStatus.REJECTED, rejectedAt: new Date(), rejectionReason: dto.reason },
      include: DETAIL_INCLUDE,
    });

    await this.notificationsService.create(
      request.farmerId,
      NotificationType.SYSTEM,
      'Payment could not be verified',
      dto.reason ?? 'We could not verify your UPI payment. Please try again or contact support.',
      { planPaymentRequestId: id },
    );

    return updated;
  }
}
