import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AdvisorAssignmentStatus, AdvisorType, FarmerSubscriptionPlan, NotificationType, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WalletService } from '../wallet/wallet.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { hasActiveRole } from '../../common/utils/auth-user.util';
import { CreateAdvisorAssignmentDto } from './dto/create-advisor-assignment.dto';

@Injectable()
export class AdvisorAssignmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly walletService: WalletService,
  ) {}

  /** Only STANDARD/PREMIUM farmers ever come with an advisor included — every roster query and stat is scoped to just those tiers. */
  private readonly STANDARD_OR_PREMIUM_FARMER_CLAUSE = {
    farmer: { farmerPlan: { plan: { in: [FarmerSubscriptionPlan.STANDARD, FarmerSubscriptionPlan.PREMIUM] } } },
  };

  /** Total/active/inactive counts for the logged-in advisor's own farmer roster (scoped per-advisor, not platform-wide). */
  async getFarmerStats(user: AuthUser) {
    const [active, inactive] = await Promise.all([
      this.prisma.advisorAssignment.count({
        where: { advisorId: user.id, status: AdvisorAssignmentStatus.ACTIVE, deletedAt: null, ...this.STANDARD_OR_PREMIUM_FARMER_CLAUSE },
      }),
      this.prisma.advisorAssignment.count({
        where: { advisorId: user.id, status: AdvisorAssignmentStatus.REVOKED, deletedAt: null, ...this.STANDARD_OR_PREMIUM_FARMER_CLAUSE },
      }),
    ]);
    return { total: active + inactive, active, inactive };
  }

  private readonly FARMER_BASIC_SELECT = {
    id: true,
    kingId: true,
    name: true,
    mobile: true,
    village: true,
    district: true,
    state: true,
    photoUrl: true,
    sprayTankSizeL: true,
    soilType: true,
    waterType: true,
    farmerPlan: { select: { plan: true, endDate: true, expiredAt: true } },
  } as const;

  /** True when this assignment is linked to a subscription whose plan has already lapsed. */
  private isAssignmentExpired(assignment: { subscription: { endDate: Date | null } | null }) {
    return !!assignment.subscription?.endDate && assignment.subscription.endDate < new Date();
  }

  /** Prisma where-fragment: no linked subscription, or a linked subscription that hasn't expired yet. */
  private notExpiredClause() {
    return {
      OR: [{ subscriptionId: null }, { subscription: { endDate: null } }, { subscription: { endDate: { gt: new Date() } } }],
    };
  }

  /** Farmer list for one of the dashboard links — ACTIVE (assigned + plan not expired), INACTIVE (revoked/subscription ended), PENDING (awaiting this advisor's accept/reject), or ALL. */
  findFarmersByStatus(user: AuthUser, status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'ALL') {
    const statusFilter =
      status === 'ACTIVE'
        ? AdvisorAssignmentStatus.ACTIVE
        : status === 'INACTIVE'
        ? AdvisorAssignmentStatus.REVOKED
        : status === 'PENDING'
        ? AdvisorAssignmentStatus.PENDING
        : { in: [AdvisorAssignmentStatus.ACTIVE, AdvisorAssignmentStatus.REVOKED] };

    return this.prisma.advisorAssignment.findMany({
      where: {
        advisorId: user.id,
        status: statusFilter,
        deletedAt: null,
        ...this.STANDARD_OR_PREMIUM_FARMER_CLAUSE,
        ...(status === 'ACTIVE' ? this.notExpiredClause() : {}),
      },
      include: {
        farmer: { select: this.FARMER_BASIC_SELECT },
        subscription: { include: { plan: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /** The logged-in farmer/gardener's most recent still-open hire request — awaiting the advisor's accept/reject. */
  findMyPendingRequest(user: AuthUser) {
    return this.prisma.advisorAssignment.findFirst({
      where: { farmerId: user.id, status: AdvisorAssignmentStatus.PENDING, deletedAt: null },
      include: {
        advisor: { select: { id: true, name: true, photoUrl: true, specialization: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /** Full detail for one farmer this advisor is (or was) assigned to — profile, subscription, and farm/plot/crop data. */
  async findFarmerDetail(user: AuthUser, farmerId: string) {
    const assignment = await this.prisma.advisorAssignment.findFirst({
      where: { advisorId: user.id, farmerId, deletedAt: null },
      include: { subscription: { include: { plan: true } } },
      orderBy: { startDate: 'desc' },
    });
    if (!assignment) {
      throw new NotFoundException('This farmer is not linked to your advisor account.');
    }

    const isExpired = this.isAssignmentExpired(assignment);

    const farmer = await this.prisma.user.findFirst({
      where: { id: farmerId, deletedAt: null },
      select: {
        ...this.FARMER_BASIC_SELECT,
        createdAt: true,
        farms: isExpired
          ? false
          : {
              where: { deletedAt: null },
              include: {
                plots: {
                  where: { deletedAt: null },
                  include: { cropCycles: { where: { deletedAt: null } } },
                },
              },
            },
      },
    });
    if (!farmer) {
      throw new NotFoundException('Farmer not found.');
    }

    return { farmer: { ...farmer, farms: farmer.farms ?? [] }, assignment, isExpired };
  }

  /** The logged-in farmer's active advisor, if any. */
  findMyAdvisor(user: AuthUser) {
    return this.prisma.advisorAssignment.findFirst({
      where: { farmerId: user.id, status: AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
      include: {
        advisor: {
          select: {
            id: true,
            name: true,
            mobile: true,
            village: true,
            district: true,
            state: true,
            photoUrl: true,
            specialization: true,
            bio: true,
            yearsExperience: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /** Farmer/Gardener: every advisor of the matching type they could choose (STANDARD/PREMIUM only — enforced in FarmerPlansService.chooseAdvisor). */
  async listAvailableAdvisors(user: AuthUser) {
    const advisorType = this.roleToAdvisorType(user);
    const advisors = await this.prisma.user.findMany({
      where: { roles: { has: Role.ADVISOR }, advisorType, deletedAt: null },
      select: {
        id: true,
        name: true,
        photoUrl: true,
        specialization: true,
        bio: true,
        yearsExperience: true,
        village: true,
        district: true,
        state: true,
        _count: { select: { advisorAssignmentsAsAdvisor: { where: { status: AdvisorAssignmentStatus.ACTIVE } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return advisors.map(({ _count, ...advisor }) => ({ ...advisor, activeFarmerCount: _count.advisorAssignmentsAsAdvisor }));
  }

  /** Confirms this advisor currently has an ACTIVE, non-expired assignment to this farmer — used by schedule/problem modules. */
  async assertAdvisorAssignedToFarmer(advisorId: string, farmerId: string) {
    const assignment = await this.prisma.advisorAssignment.findFirst({
      where: { advisorId, farmerId, status: AdvisorAssignmentStatus.ACTIVE, deletedAt: null, ...this.notExpiredClause() },
    });
    if (!assignment) {
      throw new NotFoundException('You are not the assigned advisor for this farmer.');
    }
    return assignment;
  }

  /** Same as assertAdvisorAssignedToFarmer but ignores plan expiry — used by renewal flows, which must work on an expired farmer. */
  async assertAdvisorAssignedToFarmerAnyExpiry(advisorId: string, farmerId: string) {
    const assignment = await this.prisma.advisorAssignment.findFirst({
      where: { advisorId, farmerId, status: AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
    });
    if (!assignment) {
      throw new NotFoundException('You are not the assigned advisor for this farmer.');
    }
    return assignment;
  }

  /** Least-loaded active ADVISOR-role user of the given type — no real load-balancing yet, just an even-ish spread. */
  private async pickAdvisorForAssignment(advisorType: AdvisorType) {
    const advisors = await this.prisma.user.findMany({
      where: { roles: { has: Role.ADVISOR }, advisorType, deletedAt: null },
      select: {
        id: true,
        _count: { select: { advisorAssignmentsAsAdvisor: { where: { status: AdvisorAssignmentStatus.ACTIVE } } } },
      },
    });

    if (advisors.length === 0) {
      throw new NotFoundException('No advisor is available to assign right now. Please try again later.');
    }

    advisors.sort((a, b) => a._count.advisorAssignmentsAsAdvisor - b._count.advisorAssignmentsAsAdvisor);
    return advisors[0].id;
  }

  /** FARMER needs a FARM advisor, GARDENER needs a GARDEN advisor — anything else can't be assigned. */
  private roleToAdvisorType(user: { role: Role; roles: Role[]; deactivatedRoles: Role[] }): AdvisorType {
    if (hasActiveRole(user, Role.FARMER)) return AdvisorType.FARM;
    if (hasActiveRole(user, Role.GARDENER)) return AdvisorType.GARDEN;
    throw new BadRequestException('Only farmers and gardeners can be assigned an advisor.');
  }

  /**
   * Called by SubscriptionsService once a subscription is ACTIVE — auto-picks a matching-type advisor and
   * creates the assignment as PENDING. The advisor must accept it (see `accept`/`reject`) before it becomes
   * a real working relationship — chat, crop problems, and schedules all still require ACTIVE.
   */
  async createFromSubscription(subscriptionId: string, farmerId: string) {
    const assignee = await this.prisma.user.findFirst({ where: { id: farmerId, deletedAt: null } });
    if (!assignee) {
      throw new NotFoundException('User not found.');
    }
    const advisorType = this.roleToAdvisorType(assignee);
    const advisorId = await this.pickAdvisorForAssignment(advisorType);
    const assignment = await this.prisma.advisorAssignment.create({
      data: {
        advisorId,
        farmerId,
        subscriptionId,
        status: AdvisorAssignmentStatus.PENDING,
        assignedById: farmerId,
        startDate: new Date(),
      },
      include: { advisor: { select: { id: true, name: true, mobile: true } } },
    });
    await this.notificationsService.create(
      advisorId,
      NotificationType.SYSTEM,
      'New farmer hire request',
      `${assignee.name} wants to hire you as their advisor. Review their profile and accept or reject.`,
    );
    return assignment;
  }

  /**
   * Farmer explicitly picks a specific advisor (STANDARD/PREMIUM "Choose Your Advisor" screen) — creates
   * a PENDING request for that advisor to accept/reject, same lifecycle as the auto-hire above. Blocks a
   * second open request while one is already pending or active; a rejected request can always try again.
   */
  async requestSpecificAdvisor(farmerId: string, advisorId: string) {
    const openRequest = await this.prisma.advisorAssignment.findFirst({
      where: { farmerId, status: { in: [AdvisorAssignmentStatus.PENDING, AdvisorAssignmentStatus.ACTIVE] }, deletedAt: null },
    });
    if (openRequest) {
      if (openRequest.advisorId === advisorId) return openRequest;
      throw new ConflictException(
        openRequest.status === AdvisorAssignmentStatus.ACTIVE
          ? 'You already have an active advisor.'
          : 'You already have a pending advisor request — wait for a response before requesting another.',
      );
    }

    const farmer = await this.prisma.user.findFirst({ where: { id: farmerId, deletedAt: null } });
    if (!farmer) {
      throw new NotFoundException('User not found.');
    }

    const assignment = await this.prisma.advisorAssignment.create({
      data: {
        advisorId,
        farmerId,
        status: AdvisorAssignmentStatus.PENDING,
        assignedById: farmerId,
        startDate: new Date(),
      },
      include: {
        advisor: { select: { id: true, name: true, mobile: true, photoUrl: true, specialization: true, bio: true, yearsExperience: true } },
      },
    });
    await this.notificationsService.create(
      advisorId,
      NotificationType.SYSTEM,
      'New farmer hire request',
      `${farmer.name} wants to hire you as their advisor. Review their profile and accept or reject.`,
    );
    return assignment;
  }

  /**
   * Advisor accepts a PENDING hire request — the assignment becomes ACTIVE, unlocking chat/schedule/crop-problem
   * access and making the farmer show up in the advisor's roster. Their commission share for the farmer's
   * current STANDARD/PREMIUM plan (prorated by whatever days remain right now) is paid out at this moment —
   * not at the original coupon redemption — since that's when the advisor has actually taken the farmer on.
   */
  async accept(user: AuthUser, id: string) {
    const assignment = await this.prisma.advisorAssignment.findFirst({
      where: { id, advisorId: user.id, deletedAt: null },
    });
    if (!assignment) {
      throw new NotFoundException('Hire request not found.');
    }
    if (assignment.status !== AdvisorAssignmentStatus.PENDING) {
      throw new ConflictException('This request has already been responded to.');
    }
    const updated = await this.prisma.advisorAssignment.update({
      where: { id },
      data: { status: AdvisorAssignmentStatus.ACTIVE, startDate: new Date() },
    });
    await this.payoutAdvisorShareOnAccept(assignment.farmerId, user.id);
    await this.notificationsService.create(
      assignment.farmerId,
      NotificationType.SYSTEM,
      'Advisor accepted your request',
      'Your advisor has accepted your hire request — you can now chat and get crop guidance.',
    );
    return updated;
  }

  /** Credits the advisor's wallet for the farmer's currently-active STANDARD/PREMIUM plan, prorated by days remaining. */
  private async payoutAdvisorShareOnAccept(farmerId: string, advisorId: string) {
    const plan = await this.prisma.farmerPlan.findUnique({ where: { farmerId } });
    if (!plan?.endDate || plan.endDate <= new Date()) return;
    if (plan.plan !== FarmerSubscriptionPlan.STANDARD && plan.plan !== FarmerSubscriptionPlan.PREMIUM) return;

    const pricing = await this.prisma.farmerPlanPricing.findUnique({ where: { plan: plan.plan } });
    if (!pricing?.advisorShareValue) return;

    const daysRemaining = Math.ceil((plan.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    const ratio = daysRemaining / pricing.billingPeriodDays;
    const amount = Math.round(Number(pricing.advisorShareValue) * ratio * 100) / 100;
    if (amount <= 0) return;

    const farmer = await this.prisma.user.findUnique({ where: { id: farmerId }, select: { name: true, kingId: true } });
    const farmerLabel = farmer ? `${farmer.name}${farmer.kingId ? ` (ID: ${farmer.kingId})` : ''}` : 'a farmer';
    await this.walletService.credit(
      advisorId,
      amount,
      `Advisor fee for ${plan.plan} plan — accepted ${farmerLabel} on ${new Date().toLocaleDateString('en-IN')}`,
      { relatedUserId: farmerId },
    );
  }

  /** Advisor rejects a PENDING hire request — the farmer can request another (or the same) advisor again afterwards. */
  async reject(user: AuthUser, id: string, reason?: string) {
    const assignment = await this.prisma.advisorAssignment.findFirst({
      where: { id, advisorId: user.id, deletedAt: null },
    });
    if (!assignment) {
      throw new NotFoundException('Hire request not found.');
    }
    if (assignment.status !== AdvisorAssignmentStatus.PENDING) {
      throw new ConflictException('This request has already been responded to.');
    }
    const updated = await this.prisma.advisorAssignment.update({
      where: { id },
      data: { status: AdvisorAssignmentStatus.REVOKED, endDate: new Date(), notes: reason?.trim() || undefined },
    });
    await this.notificationsService.create(
      assignment.farmerId,
      NotificationType.SYSTEM,
      'Advisor request declined',
      reason?.trim()
        ? `Your advisor request was declined: ${reason.trim()}. You can send another request.`
        : 'Your advisor request was declined. You can send another request.',
    );
    return updated;
  }

  /** Admin-only manual override, e.g. for support cases. */
  async create(user: AuthUser, dto: CreateAdvisorAssignmentDto) {
    const existing = await this.prisma.advisorAssignment.findFirst({
      where: { farmerId: dto.farmerId, status: AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('This farmer already has an active advisor assignment.');
    }

    const [advisor, assignee] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: dto.advisorId, deletedAt: null } }),
      this.prisma.user.findFirst({ where: { id: dto.farmerId, deletedAt: null } }),
    ]);
    if (!advisor || !hasActiveRole(advisor, Role.ADVISOR)) {
      throw new BadRequestException('advisorId must belong to a user with the ADVISOR role.');
    }
    if (!assignee) {
      throw new NotFoundException('User not found.');
    }
    const requiredType = this.roleToAdvisorType(assignee);
    if (advisor.advisorType !== requiredType) {
      throw new BadRequestException(
        `A ${requiredType === AdvisorType.FARM ? 'Farm' : 'Garden'} Advisor is required for this user.`,
      );
    }

    return this.prisma.advisorAssignment.create({
      data: {
        advisorId: dto.advisorId,
        farmerId: dto.farmerId,
        subscriptionId: dto.subscriptionId,
        status: AdvisorAssignmentStatus.ACTIVE,
        assignedById: user.id,
        startDate: new Date(),
      },
    });
  }

  async findOneOrThrow(user: AuthUser, id: string) {
    const assignment = await this.prisma.advisorAssignment.findFirst({ where: { id, deletedAt: null } });
    if (
      !assignment ||
      (user.role !== Role.ADMIN &&
        user.role !== Role.SUPER_ADMIN &&
        assignment.advisorId !== user.id &&
        assignment.farmerId !== user.id)
    ) {
      throw new NotFoundException('Advisor assignment not found.');
    }
    return assignment;
  }

  async revoke(user: AuthUser, id: string) {
    await this.findOneOrThrow(user, id);
    return this.prisma.advisorAssignment.update({
      where: { id },
      data: { status: AdvisorAssignmentStatus.REVOKED, endDate: new Date() },
    });
  }

  /** Advisor nudges a formerly-assigned (now inactive) farmer to renew their plan. */
  async sendRenewalReminder(user: AuthUser, farmerId: string) {
    const hadAssignment = await this.prisma.advisorAssignment.findFirst({
      where: { advisorId: user.id, farmerId, deletedAt: null },
    });
    if (!hadAssignment) {
      throw new NotFoundException('This farmer has never been assigned to you.');
    }

    const farmer = await this.prisma.user.findFirst({ where: { id: farmerId, deletedAt: null }, select: { name: true } });
    if (!farmer) {
      throw new NotFoundException('Farmer not found.');
    }

    await this.notificationsService.create(
      farmerId,
      NotificationType.PAYMENT_DUE,
      'Renew your plan',
      `Your advisor ${user.name} is waiting to help you again — renew your plan to restore your advisor support.`,
      { advisorId: user.id, isReminder: true },
    );

    return { success: true };
  }
}
