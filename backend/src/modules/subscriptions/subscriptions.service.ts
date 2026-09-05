import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FarmerSubscriptionPlan, GardenerSubscriptionPlan, Role, SubscriptionPlanStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdvisorAssignmentService } from '../advisor-assignment/advisor-assignment.service';
import { WhatsAppGroupSyncService } from '../whatsapp/whatsapp-group-sync.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly advisorAssignmentService: AdvisorAssignmentService,
    private readonly whatsAppGroupSyncService: WhatsAppGroupSyncService,
  ) {}


  /**
   * Hiring an advisor (subscription going ACTIVE) upgrades the farmer/gardener to their PREMIUM plan tier.
   * If they already have an unexpired plan, the new days are added onto its existing end date instead of
   * being counted from today — same "renew from expiry, not from now" rule used everywhere else in the app.
   */
  private async upgradePlanForSubscription(userId: string, billingCycle: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) return;

    const durationDays = billingCycle === 'YEARLY' ? 365 : 30;
    const now = new Date();

    if (user.role === Role.FARMER) {
      const current = await this.prisma.farmerPlan.findUnique({ where: { farmerId: userId } });
      const baseDate = current?.endDate && current.endDate > now ? current.endDate : now;
      const endDate = new Date(baseDate.getTime() + durationDays * DAY_MS);
      await this.prisma.farmerPlan.upsert({
        where: { farmerId: userId },
        create: { farmerId: userId, plan: FarmerSubscriptionPlan.PRO, endDate },
        update: { plan: FarmerSubscriptionPlan.PRO, endDate },
      });
    } else if (user.role === Role.GARDENER) {
      const current = await this.prisma.gardenerPlan.findUnique({ where: { gardenerId: userId } });
      const baseDate = current?.endDate && current.endDate > now ? current.endDate : now;
      const endDate = new Date(baseDate.getTime() + durationDays * DAY_MS);
      await this.prisma.gardenerPlan.upsert({
        where: { gardenerId: userId },
        create: { gardenerId: userId, plan: GardenerSubscriptionPlan.PREMIUM, endDate },
        update: { plan: GardenerSubscriptionPlan.PREMIUM, endDate },
      });
    }
  }

  listPlans() {
    return this.prisma.advisorPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  /** Farmer subscribes — payment is simulated, so the subscription (and its advisor assignment) go ACTIVE immediately. */
  async create(user: AuthUser, dto: CreateSubscriptionDto) {
    if (user.role === Role.FARMER) {
      const farmerPlan = await this.prisma.farmerPlan.findUnique({ where: { farmerId: user.id } });
      const now = new Date();
      const isSoftwarePlanActive = Boolean(
        farmerPlan &&
        farmerPlan.plan !== FarmerSubscriptionPlan.FREE &&
        farmerPlan.endDate &&
        farmerPlan.endDate > now
      );
      if (!isSoftwarePlanActive) {
        throw new BadRequestException('You must have an active Paid Software Plan before hiring an Advisor.');
      }
    }

    const existing = await this.prisma.advisorSubscription.findFirst({
      where: { farmerId: user.id, status: SubscriptionPlanStatus.ACTIVE, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('You already have an active Farmer Advisor subscription.');
    }

    const plan = await this.prisma.advisorPlan.findFirst({ where: { id: dto.planId, isActive: true } });
    if (!plan) {
      throw new NotFoundException('Advisor plan not found.');
    }

    const now = new Date();
    const subscription = await this.prisma.advisorSubscription.create({
      data: {
        farmerId: user.id,
        planId: dto.planId,
        status: SubscriptionPlanStatus.ACTIVE,
        approvedAt: now,
        startDate: now,
      },
      include: { plan: true },
    });

    const assignment = await this.advisorAssignmentService.createFromSubscription(subscription.id, user.id);
    await this.upgradePlanForSubscription(user.id, plan.billingCycle);

    this.whatsAppGroupSyncService.syncSingleFarmerGroupStatus(user.id).catch(() => {});
    return { ...subscription, advisorAssignment: assignment };
  }

  findMine(user: AuthUser) {
    return this.prisma.advisorSubscription.findFirst({
      where: { farmerId: user.id, deletedAt: null },
      include: {
        plan: true,
        advisorAssignment: {
          include: { advisor: { select: { id: true, name: true, mobile: true, village: true, district: true, state: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOrThrow(user: AuthUser, id: string) {
    const subscription = await this.prisma.advisorSubscription.findFirst({ where: { id, deletedAt: null } });
    if (!subscription || (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN && subscription.farmerId !== user.id)) {
      throw new NotFoundException('Subscription not found.');
    }
    return subscription;
  }

  async approve(user: AuthUser, id: string) {
    const subscription = await this.findOneOrThrow(user, id);
    const now = new Date();
    const updated = await this.prisma.advisorSubscription.update({
      where: { id },
      data: { status: SubscriptionPlanStatus.ACTIVE, approvedAt: now, approvedById: user.id, startDate: now },
    });

    const hasAssignment = await this.prisma.advisorAssignment.findFirst({ where: { subscriptionId: id } });
    if (!hasAssignment) {
      await this.advisorAssignmentService.createFromSubscription(id, subscription.farmerId);
    }

    const plan = await this.prisma.advisorPlan.findFirst({ where: { id: subscription.planId } });
    await this.upgradePlanForSubscription(subscription.farmerId, plan?.billingCycle ?? 'MONTHLY');

    this.whatsAppGroupSyncService.syncSingleFarmerGroupStatus(subscription.farmerId).catch(() => {});
    return updated;
  }

  async reject(user: AuthUser, id: string) {
    const subscription = await this.findOneOrThrow(user, id);
    const updated = await this.prisma.advisorSubscription.update({
      where: { id },
      data: { status: SubscriptionPlanStatus.REJECTED },
    });

    this.whatsAppGroupSyncService.syncSingleFarmerGroupStatus(subscription.farmerId).catch(() => {});
    return updated;
  }

  async cancel(user: AuthUser, id: string) {
    const subscription = await this.findOneOrThrow(user, id);
    const updated = await this.prisma.advisorSubscription.update({
      where: { id },
      data: { status: SubscriptionPlanStatus.CANCELLED, cancelledAt: new Date() },
    });

    const assignment = await this.prisma.advisorAssignment.findFirst({
      where: { subscriptionId: subscription.id, status: 'ACTIVE' },
    });
    if (assignment) {
      await this.advisorAssignmentService.revoke(user, assignment.id);
    }

    this.whatsAppGroupSyncService.syncSingleFarmerGroupStatus(subscription.farmerId).catch(() => {});
    return updated;
  }
}

