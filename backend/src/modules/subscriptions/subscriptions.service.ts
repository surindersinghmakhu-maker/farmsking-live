import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, SubscriptionPlanStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdvisorAssignmentService } from '../advisor-assignment/advisor-assignment.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly advisorAssignmentService: AdvisorAssignmentService,
  ) {}

  listPlans() {
    return this.prisma.advisorPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  /** Farmer subscribes — payment is simulated, so the subscription (and its advisor assignment) go ACTIVE immediately. */
  async create(user: AuthUser, dto: CreateSubscriptionDto) {
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
    if (!subscription || (user.role !== Role.ADMIN && subscription.farmerId !== user.id)) {
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

    return updated;
  }

  async reject(user: AuthUser, id: string) {
    await this.findOneOrThrow(user, id);
    return this.prisma.advisorSubscription.update({
      where: { id },
      data: { status: SubscriptionPlanStatus.REJECTED },
    });
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

    return updated;
  }
}
