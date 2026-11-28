import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { AdvisorAssignmentStatus, AdvisorType, CropAdvisorReviewStatus, CropStatus, FarmerSubscriptionPlan, NotificationType, Role, SubscriptionPlanStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WalletService } from '../wallet/wallet.service';
import { WhatsAppGroupSyncService } from '../whatsapp/whatsapp-group-sync.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { hasActiveRole } from '../../common/utils/auth-user.util';
import { CreateAdvisorAssignmentDto } from './dto/create-advisor-assignment.dto';

@Injectable()
export class AdvisorAssignmentService implements OnApplicationBootstrap {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly walletService: WalletService,
    private readonly whatsAppGroupSyncService: WhatsAppGroupSyncService,
    private readonly appSettingsService: AppSettingsService,
  ) {}


  async onApplicationBootstrap() {
    // Multi-advisor architecture active
  }

  /** Only paid plan farmers (PRO/SMART/SUPER) ever come with an advisor included — every roster query and stat is scoped to those tiers. */
  private readonly STANDARD_OR_PREMIUM_FARMER_CLAUSE = {
    farmer: { farmerPlan: { plan: { in: [FarmerSubscriptionPlan.PRO, FarmerSubscriptionPlan.SMART, FarmerSubscriptionPlan.SUPER, FarmerSubscriptionPlan.VIP] } } },
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

  /** Farmer/Gardener list for one of the dashboard links — ACTIVE (assigned), INACTIVE (revoked), PENDING (awaiting accept/reject), or ALL. */
  findFarmersByStatus(user: AuthUser, status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'ALL') {
    const requiredType = this.roleToAdvisorType(user);
    const clientRoleClause = requiredType === AdvisorType.GARDEN
      ? { OR: [{ role: Role.GARDENER }, { roles: { has: Role.GARDENER } }] }
      : { OR: [{ role: Role.FARMER }, { roles: { has: Role.FARMER } }] };

    const statusFilter =
      status === 'ACTIVE'
        ? AdvisorAssignmentStatus.ACTIVE
        : status === 'INACTIVE'
        ? AdvisorAssignmentStatus.REVOKED
        : status === 'PENDING'
        ? AdvisorAssignmentStatus.PENDING
        : { in: [AdvisorAssignmentStatus.ACTIVE, AdvisorAssignmentStatus.REVOKED, AdvisorAssignmentStatus.PENDING] };

    const activeClause =
      status === 'ACTIVE'
        ? {
            OR: [
              { subscriptionId: null },
              { subscription: { endDate: null } },
              { subscription: { endDate: { gt: new Date() } } },
            ],
          }
        : {};

    return this.prisma.advisorAssignment.findMany({
      where: {
        advisorId: user.id,
        status: statusFilter,
        deletedAt: null,
        farmer: { deletedAt: null, ...clientRoleClause },
        ...activeClause,
      },
      include: {
        farmer: { select: this.FARMER_BASIC_SELECT },
        subscription: { include: { plan: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }



  /** Full detail for one farmer this advisor is (or was) assigned to — profile, subscription, and farm/plot/crop data. */
  async findFarmerDetail(user: AuthUser, farmerId: string) {
    const assignment = await this.prisma.advisorAssignment.findFirst({
      where: {
        farmerId,
        deletedAt: null,
        ...(hasActiveRole(user, Role.ADMIN) || hasActiveRole(user, Role.SUPER_ADMIN) ? {} : { advisorId: user.id }),
      },
      include: { subscription: { include: { plan: true } } },
      orderBy: { startDate: 'desc' },
    });

    if (!assignment && !hasActiveRole(user, Role.ADMIN) && !hasActiveRole(user, Role.SUPER_ADMIN)) {
      throw new ForbiddenException('You are not assigned to view this farmer profile.');
    }

    const isExpired = assignment ? this.isAssignmentExpired(assignment) : false;

    const farmer = await this.prisma.user.findFirst({
      where: { id: farmerId },
      select: {
        ...this.FARMER_BASIC_SELECT,
        createdAt: true,
        deletedAt: true,
        ...(isExpired
          ? {}
          : {
              farms: {
                where: { deletedAt: null },
                include: {
                  plots: {
                    where: { deletedAt: null },
                    include: { cropCycles: { where: { deletedAt: null } } },
                  },
                },
              },
              gardens: {
                include: {
                  plants: {
                    where: { deletedAt: null },
                    include: {
                      schedules: { orderBy: { nextDueDate: 'asc' } },
                      healthLogs: { orderBy: { loggedAt: 'desc' }, take: 10 },
                      diagnoses: { orderBy: { createdAt: 'desc' }, take: 5 },
                    },
                  },
                  schedules: { orderBy: { nextDueDate: 'asc' } },
                },
              },
              plants: {
                where: { gardenId: null, deletedAt: null },
                include: {
                  schedules: { orderBy: { nextDueDate: 'asc' } },
                  healthLogs: { orderBy: { loggedAt: 'desc' }, take: 10 },
                  diagnoses: { orderBy: { createdAt: 'desc' }, take: 5 },
                },
              },
            }),
      },
    });
    if (!farmer) {
      throw new NotFoundException('Farmer not found.');
    }

    return {
      farmer: {
        ...farmer,
        farms: (farmer as any).farms ?? [],
        gardens: (farmer as any).gardens ?? [],
        plants: (farmer as any).plants ?? [],
      },
      assignment,
      isExpired,
    };
  }

  private async getDoctorRatingStats(advisorIds: string[]) {
    if (!advisorIds.length) return new Map<string, { rating: number | null; ratingCount: number; ratingLabel: string }>();

    const stats = await this.prisma.cropProblem.groupBy({
      by: ['assignedAdvisorId'],
      where: {
        assignedAdvisorId: { in: advisorIds },
        farmerRating: { not: null },
        deletedAt: null,
      },
      _avg: { farmerRating: true },
      _count: { farmerRating: true },
    });

    const map = new Map<string, { rating: number | null; ratingCount: number; ratingLabel: string }>();
    for (const stat of stats) {
      if (stat.assignedAdvisorId && stat._count.farmerRating > 0 && stat._avg.farmerRating !== null) {
        const avg = Math.round(stat._avg.farmerRating * 10) / 10;
        const count = stat._count.farmerRating;
        map.set(stat.assignedAdvisorId, {
          rating: avg,
          ratingCount: count,
          ratingLabel: `${avg} ★ (${count})`,
        });
      }
    }
    return map;
  }

  /** The logged-in farmer's active advisor, if any. */
  async findMyAdvisor(user: AuthUser) {
    const assignment = await this.prisma.advisorAssignment.findFirst({
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

    if (!assignment || !assignment.advisor) return assignment;

    const ratingMap = await this.getDoctorRatingStats([assignment.advisor.id]);
    const rStats = ratingMap.get(assignment.advisor.id) ?? { rating: null, ratingCount: 0, ratingLabel: 'No rating till now' };

    return {
      ...assignment,
      advisor: {
        ...assignment.advisor,
        ...rStats,
      },
    };
  }

  /** Farmer/Gardener: every advisor of the matching type they could choose (STANDARD/PREMIUM only — enforced in FarmerPlansService.chooseAdvisor). */
  async listAvailableAdvisors(user?: AuthUser | null) {
    const requiredType = this.roleToAdvisorType(user);
    const advisors = await this.prisma.user.findMany({
      where: {
        AND: [
          { OR: [{ role: Role.ADVISOR }, { roles: { has: Role.ADVISOR } }] },
          {
            OR: [
              { advisorType: requiredType },
              ...(requiredType === AdvisorType.FARM ? [{ advisorType: null }] : []),
            ],
          },
        ],
        deletedAt: null,
      },
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
        isSeniorDoctor: true,
        seniorDoctorId: true,
        doctorConsultationFee: true,
        feePerConsultation: true,
        feePerCropSeason: true,
        feeVipMonthly: true,
        monthlyIncludedCrops: true,
        feeAdditionalCropMonthly: true,
        specializedCategories: true,
        specializedCrops: true,
        qualification: true,
        profileTitle: true,
        _count: { select: { advisorAssignmentsAsAdvisor: { where: { status: AdvisorAssignmentStatus.ACTIVE } } } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const ratingMap = await this.getDoctorRatingStats(advisors.map((a) => a.id));

    return advisors.map(({ _count, ...advisor }) => {
      const rStats = ratingMap.get(advisor.id) ?? { rating: null, ratingCount: 0, ratingLabel: 'No rating till now' };
      return {
        ...advisor,
        activeFarmerCount: _count.advisorAssignmentsAsAdvisor,
        ...rStats,
      };
    });
  }

  /**
   * Farmer/Gardener: browse matching specialist advisors for a specific crop.
   * Filters strictly by crop category and crop name specialization, and checks the farmer's active monthly quota.
   */
  async listAvailableAdvisorsForCrop(user: AuthUser, cropCycleId: string) {
    const cropCycle = await this.prisma.cropCycle.findFirst({
      where: { id: cropCycleId, deletedAt: null },
      include: {
        plot: { include: { farm: true } },
      },
    });
    if (!cropCycle) {
      throw new NotFoundException('Crop cycle not found.');
    }

    const requiredType = this.roleToAdvisorType(user);

    // 1. Fetch all active advisors of matching type
    const advisors = await this.prisma.user.findMany({
      where: {
        AND: [
          { OR: [{ role: Role.ADVISOR }, { roles: { has: Role.ADVISOR } }] },
          {
            OR: [
              { advisorType: requiredType },
              ...(requiredType === AdvisorType.FARM ? [{ advisorType: null }] : []),
            ],
          },
        ],
        deletedAt: null,
      },
      select: {
        id: true,
        kingId: true,
        name: true,
        photoUrl: true,
        specialization: true,
        bio: true,
        yearsExperience: true,
        village: true,
        district: true,
        state: true,
        isSeniorDoctor: true,
        seniorDoctorId: true,
        doctorConsultationFee: true,
        feePerConsultation: true,
        feePerCropSeason: true,
        feeVipMonthly: true,
        monthlyIncludedCrops: true,
        feeAdditionalCropMonthly: true,
        specializedCategories: true,
        specializedCrops: true,
        qualification: true,
        profileTitle: true,
        _count: { select: { advisorAssignmentsAsAdvisor: { where: { status: AdvisorAssignmentStatus.ACTIVE } } } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const ratingMap = await this.getDoctorRatingStats(advisors.map((a) => a.id));

    // 2. Filter advisors based on crop category and crop name matching
    const matchingAdvisors = advisors.filter((advisor) => {
      const hasCategories = Array.isArray(advisor.specializedCategories) && advisor.specializedCategories.length > 0;
      const hasCrops = Array.isArray(advisor.specializedCrops) && advisor.specializedCrops.length > 0;

      // If doctor hasn't set any filters, or explicitly selected ALL crops, they are eligible for all crops
      if (!hasCategories && !hasCrops) return true;
      if (hasCrops && advisor.specializedCrops.some((sc) => {
        const up = sc.toUpperCase().trim();
        return up === 'ALL' || up === 'ALL_CROPS' || up === 'ALL CROPS' || up.includes('ALL CROP');
      })) {
        return true;
      }

      // Check category match
      let categoryMatch = false;
      if (hasCategories && cropCycle.category) {
        categoryMatch = advisor.specializedCategories.includes(cropCycle.category);
      }

      // Check specific crop name match (case-insensitive substring)
      let cropNameMatch = false;
      if (hasCrops && cropCycle.cropName) {
        const cLower = cropCycle.cropName.toLowerCase();
        cropNameMatch = advisor.specializedCrops.some((sc) => sc.toLowerCase().includes(cLower) || cLower.includes(sc.toLowerCase()));
      }

      if (hasCategories && hasCrops) {
        return categoryMatch || cropNameMatch;
      }
      if (hasCategories) return categoryMatch;
      if (hasCrops) return cropNameMatch;
      return true;
    });

    // 3. For each matching advisor, check farmer's active subscription and quota
    const results = await Promise.all(
      matchingAdvisors.map(async ({ _count, ...advisor }) => {
        const rStats = ratingMap.get(advisor.id) ?? { rating: null, ratingCount: 0, ratingLabel: 'No rating till now' };

        // Check if farmer has an active monthly subscription with this advisor
        const activeSub = await this.prisma.advisorSubscription.findFirst({
          where: {
            farmerId: user.id,
            status: SubscriptionPlanStatus.ACTIVE,
            OR: [
              { endDate: { gt: new Date() } },
              // Include grace period (up to 7 days post-expiry)
              { endDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
            ],
            advisorAssignment: { advisorId: advisor.id },
          },
          select: { id: true, endDate: true, notes: true },
        });

        let quotaStatus: 'INCLUDED_FREE' | 'ADDITIONAL_CROP_FEE' | 'NOT_SUBSCRIBED' = 'NOT_SUBSCRIBED';
        let freeSlotsRemaining = 0;
        let activeCropsUnderAdvisor = 0;
        const maxIncluded = advisor.monthlyIncludedCrops ?? 3;

        if (activeSub) {
          activeCropsUnderAdvisor = await this.prisma.cropCycle.count({
            where: {
              assignedAdvisorId: advisor.id,
              deletedAt: null,
              status: { notIn: [CropStatus.COMPLETED, CropStatus.FAILED] },
            },
          });
          freeSlotsRemaining = Math.max(0, maxIncluded - activeCropsUnderAdvisor);
          quotaStatus = freeSlotsRemaining > 0 ? 'INCLUDED_FREE' : 'ADDITIONAL_CROP_FEE';
        }

        const isAlreadyAssigned = Boolean(
          cropCycle.assignedAdvisorId === advisor.id &&
          cropCycle.advisorReviewStatus !== CropAdvisorReviewStatus.NONE
        );

        const isWithdrawnLocked = Boolean(
          cropCycle.notes?.includes(`[WITHDRAWN_FROM_DOCTOR:${advisor.id}]`) ||
          (cropCycle.notes?.includes(`[WITHDRAWAL_PENDING:${advisor.id}|`) &&
            (() => {
              const m = cropCycle.notes.match(new RegExp(`\\[WITHDRAWAL_PENDING:${advisor.id}\\|[^|]+\\|([^\\]]+)\\]`));
              return m ? new Date() > new Date(m[1]) : false;
            })())
        );

        const isGracePeriod = Boolean(
          activeSub?.endDate &&
          activeSub.endDate < new Date() &&
          Date.now() <= activeSub.endDate.getTime() + 7 * 24 * 60 * 60 * 1000
        );

        const isSleepMode = Boolean(activeSub?.notes?.includes('[SLEEP_MODE:'));

        return {
          ...advisor,
          activeFarmerCount: _count.advisorAssignmentsAsAdvisor,
          ...rStats,
          isAlreadyAssignedToThisCrop: isAlreadyAssigned,
          isWithdrawnLocked,
          assignedCropReviewStatus: isAlreadyAssigned ? cropCycle.advisorReviewStatus : null,
          activeHiringModelForCrop: isAlreadyAssigned ? cropCycle.hiringModel : null,
          quota: {
            hasActiveMonthlySubscription: !!activeSub,
            activeSubscriptionId: activeSub?.id ?? null,
            subscriptionEndDate: activeSub?.endDate ?? null,
            isGracePeriod,
            isSleepMode,
            graceDaysRemaining: isGracePeriod && activeSub?.endDate
              ? Math.max(0, Math.ceil((activeSub.endDate.getTime() + 7 * 86400000 - Date.now()) / 86400000))
              : 0,
            quotaStatus,
            monthlyIncludedCrops: maxIncluded,
            activeCropsUnderAdvisor,
            freeSlotsRemaining,
            additionalCropFee: Number(advisor.feeAdditionalCropMonthly ?? 300),
          },
        };
      }),
    );

    // Sort: advisors where farmer has free slots first, then highest rating
    results.sort((a, b) => {
      if (a.quota.quotaStatus === 'INCLUDED_FREE' && b.quota.quotaStatus !== 'INCLUDED_FREE') return -1;
      if (b.quota.quotaStatus === 'INCLUDED_FREE' && a.quota.quotaStatus !== 'INCLUDED_FREE') return 1;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

    return results;
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
    const sudhirAdvisor = await this.prisma.user.findFirst({
      where: {
        name: { contains: 'Sudhir', mode: 'insensitive' },
        AND: [
          { OR: [{ role: Role.ADVISOR }, { roles: { has: Role.ADVISOR } }] },
          {
            OR: [
              { advisorType },
              ...(advisorType === AdvisorType.FARM ? [{ advisorType: null }] : []),
            ],
          },
        ],
        deletedAt: null,
      },
      select: { id: true },
    });

    if (sudhirAdvisor && advisorType === AdvisorType.FARM) {
      return sudhirAdvisor.id;
    }

    const advisors = await this.prisma.user.findMany({
      where: {
        AND: [
          { OR: [{ role: Role.ADVISOR }, { roles: { has: Role.ADVISOR } }] },
          {
            OR: [
              { advisorType },
              ...(advisorType === AdvisorType.FARM ? [{ advisorType: null }] : []),
            ],
          },
        ],
        deletedAt: null,
      },
      select: {
        id: true,
        _count: { select: { advisorAssignmentsAsAdvisor: { where: { status: AdvisorAssignmentStatus.ACTIVE } } } },
      },
    });

    if (advisors.length === 0) {
      throw new NotFoundException(`No ${advisorType === AdvisorType.FARM ? 'Crop Doctor / Farm Advisor' : 'Garden Advisor'} is available right now.`);
    }

    advisors.sort((a, b) => a._count.advisorAssignmentsAsAdvisor - b._count.advisorAssignmentsAsAdvisor);
    return advisors[0].id;
  }

  /** FARMER needs a FARM advisor, GARDENER needs a GARDEN advisor — anything else can't be assigned. */
  private roleToAdvisorType(user?: { role: Role; roles: Role[]; deactivatedRoles: Role[] } | null): AdvisorType {
    if (user && hasActiveRole(user, Role.GARDENER)) return AdvisorType.GARDEN;
    return AdvisorType.FARM;
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

  /** The logged-in farmer/gardener's most recent still-open hire request — awaiting admin approval or advisor's accept/reject. */
  findMyPendingRequest(user: AuthUser) {
    return this.prisma.advisorAssignment.findFirst({
      where: {
        farmerId: user.id,
        status: { in: [AdvisorAssignmentStatus.PENDING, AdvisorAssignmentStatus.ADMIN_APPROVAL_PENDING] },
        deletedAt: null,
      },
      include: {
        advisor: { select: { id: true, name: true, photoUrl: true, specialization: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * Farmer explicitly picks a specific advisor.
   * If farmer already has an ACTIVE advisor, requirement requires Super Admin approval first (status: ADMIN_APPROVAL_PENDING)
   * so Super Admin can notify current doctor.
   * If farmer has NO active advisor, creates a direct PENDING request for the new doctor.
   */
  async requestSpecificAdvisor(farmerId: string, advisorId: string, cropId?: string) {
    let cropName = '';
    let cropVariety = '';
    let selectedCrop: any = null;
    if (cropId) {
      selectedCrop = await this.prisma.cropCycle.findFirst({
        where: { id: cropId, deletedAt: null, plot: { farm: { ownerId: farmerId, deletedAt: null } } },
      });
      if (selectedCrop) {
        cropName = selectedCrop.cropName;
        cropVariety = selectedCrop.variety || '';
      }
    }

    const existingSame = await this.prisma.advisorAssignment.findFirst({
      where: {
        farmerId,
        advisorId,
        status: { in: [AdvisorAssignmentStatus.PENDING, AdvisorAssignmentStatus.ADMIN_APPROVAL_PENDING, AdvisorAssignmentStatus.ACTIVE] },
        deletedAt: null,
      },
    });
    if (existingSame) {
      if (cropId && selectedCrop) {
        await this.prisma.cropCycle.update({
          where: { id: cropId },
          data: { advisorReviewStatus: 'PENDING' as any, submittedToAdvisorAt: new Date() },
        });
      }
      return existingSame;
    }

    const farmer = await this.prisma.user.findFirst({ where: { id: farmerId, deletedAt: null } });
    if (!farmer) {
      throw new NotFoundException('User not found.');
    }

    // Check if farmer currently has an active advisor assignment with another doctor
    const currentActive = await this.prisma.advisorAssignment.findFirst({
      where: { farmerId, status: AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
      include: { advisor: { select: { id: true, name: true, mobile: true } } },
    });

    const isDoctorChange = !!currentActive && currentActive.advisorId !== advisorId && !cropId;
    const initialStatus = isDoctorChange
      ? AdvisorAssignmentStatus.ADMIN_APPROVAL_PENDING
      : AdvisorAssignmentStatus.PENDING;

    const assignmentNotes = cropName
      ? `Crop: ${cropName}${cropVariety ? ` (${cropVariety})` : ''} [Crop ID: ${selectedCrop?.cropId || cropId}]`
      : (isDoctorChange ? `Doctor Change Request from Dr. ${currentActive?.advisor?.name}` : undefined);

    const assignment = await this.prisma.advisorAssignment.create({
      data: {
        advisorId,
        farmerId,
        status: initialStatus,
        assignedById: farmerId,
        startDate: new Date(),
        notes: assignmentNotes,
      },
      include: {
        advisor: { select: { id: true, name: true, mobile: true, photoUrl: true, specialization: true, bio: true, yearsExperience: true } },
      },
    });

    if (cropId && selectedCrop) {
      await this.prisma.cropCycle.update({
        where: { id: cropId },
        data: { advisorReviewStatus: 'PENDING' as any, submittedToAdvisorAt: new Date() },
      });
    }

    if (isDoctorChange) {
      const admins = await this.prisma.user.findMany({
        where: { roles: { hasSome: [Role.ADMIN, Role.SUPER_ADMIN] }, deletedAt: null },
        select: { id: true },
      });
      for (const admin of admins) {
        await this.notificationsService.create(
          admin.id,
          NotificationType.SYSTEM,
          'Doctor Change Request Pending Review',
          `Farmer ${farmer.name} requested to switch doctor from Dr. ${currentActive?.advisor?.name} to Dr. ${assignment.advisor.name}. Admin review required.`,
        );
      }
      await this.notificationsService.create(
        farmerId,
        NotificationType.SYSTEM,
        'Doctor Change Request Submitted',
        'Your request to change crop doctor has been submitted to Admin for approval. Admin will notify your current doctor.',
      );
    } else {
      await this.notificationsService.create(
        advisorId,
        NotificationType.SYSTEM,
        cropName ? `New Crop Care Request: ${cropName}` : 'New farmer hire request',
        `${farmer.name} wants to hire you as crop advisor${cropName ? ` for "${cropName}"` : ''}. Review details and accept or decline.`,
        { cropCycleId: cropId || undefined, farmerId },
      );
    }

    return assignment;
  }

  /** Super Admin list all pending doctor change requests requiring approval. */
  async findPendingDoctorChangeRequests() {
    return this.prisma.advisorAssignment.findMany({
      where: { status: AdvisorAssignmentStatus.ADMIN_APPROVAL_PENDING, deletedAt: null },
      include: {
        farmer: { select: { id: true, name: true, mobile: true, kingId: true, state: true, district: true } },
        advisor: { select: { id: true, name: true, mobile: true, photoUrl: true, specialization: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Super Admin approves doctor change request — forwards request to new doctor & notifies current doctor. */
  async adminApproveDoctorChange(adminUser: AuthUser, assignmentId: string) {
    const assignment = await this.prisma.advisorAssignment.findFirst({
      where: { id: assignmentId, status: AdvisorAssignmentStatus.ADMIN_APPROVAL_PENDING, deletedAt: null },
      include: {
        farmer: { select: { id: true, name: true, mobile: true } },
        advisor: { select: { id: true, name: true, mobile: true } },
      },
    });
    if (!assignment) {
      throw new NotFoundException('Pending Doctor Change Request not found.');
    }

    // Find current active doctor to send courtesy notification
    const currentActive = await this.prisma.advisorAssignment.findFirst({
      where: { farmerId: assignment.farmerId, status: AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
      include: { advisor: { select: { id: true, name: true } } },
    });

    if (currentActive) {
      await this.notificationsService.create(
        currentActive.advisorId,
        NotificationType.SYSTEM,
        'Farmer Doctor Change Notice',
        `Farmer ${assignment.farmer.name} is changing their crop doctor. Admin has approved the request.`,
      );
    }

    // Advance assignment status to PENDING for the new doctor to accept/reject
    const updated = await this.prisma.advisorAssignment.update({
      where: { id: assignmentId },
      data: { status: AdvisorAssignmentStatus.PENDING },
    });

    await this.notificationsService.create(
      assignment.advisorId,
      NotificationType.SYSTEM,
      'New farmer hire request',
      `${assignment.farmer.name} wants to hire you as their advisor. Review their profile and accept or reject.`,
    );

    await this.notificationsService.create(
      assignment.farmerId,
      NotificationType.SYSTEM,
      'Doctor Change Request Approved by Admin',
      `Admin approved your doctor change request! Request has been forwarded to Dr. ${assignment.advisor.name}.`,
    );

    return updated;
  }

  /** Super Admin rejects doctor change request. */
  async adminRejectDoctorChange(adminUser: AuthUser, assignmentId: string, reason?: string) {
    const assignment = await this.prisma.advisorAssignment.findFirst({
      where: { id: assignmentId, status: AdvisorAssignmentStatus.ADMIN_APPROVAL_PENDING, deletedAt: null },
    });
    if (!assignment) {
      throw new NotFoundException('Pending Doctor Change Request not found.');
    }

    const updated = await this.prisma.advisorAssignment.update({
      where: { id: assignmentId },
      data: {
        status: AdvisorAssignmentStatus.REVOKED,
        endDate: new Date(),
        notes: `Doctor change rejected by Admin: ${reason || 'No reason specified'}`,
      },
    });

    await this.notificationsService.create(
      assignment.farmerId,
      NotificationType.SYSTEM,
      'Doctor Change Request Update',
      `Your doctor change request was not approved by Admin${reason ? `: ${reason}` : '.'}`,
    );

    return updated;
  }

  /** Farmer/Gardener cancels their own pending hire request. */
  async cancelMyPendingRequest(user: AuthUser) {
    const pending = await this.prisma.advisorAssignment.findFirst({
      where: { farmerId: user.id, status: AdvisorAssignmentStatus.PENDING, deletedAt: null },
    });
    if (!pending) {
      throw new NotFoundException('No pending advisor request found.');
    }
    const updated = await this.prisma.advisorAssignment.update({
      where: { id: pending.id },
      data: { status: AdvisorAssignmentStatus.REVOKED, endDate: new Date(), notes: 'Cancelled by farmer' },
    });
    return updated;
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

    // Revoke any previous active or pending assignments for this farmer so the new doctor takes over
    await this.prisma.advisorAssignment.updateMany({
      where: {
        farmerId: assignment.farmerId,
        id: { not: assignment.id },
        status: { in: [AdvisorAssignmentStatus.ACTIVE, AdvisorAssignmentStatus.PENDING] },
        deletedAt: null,
      },
      data: { status: AdvisorAssignmentStatus.REVOKED, endDate: new Date(), notes: 'Replaced by new doctor acceptance' },
    });
    // Auto-link CropCycle when assignment contains Crop ID
    if (assignment.notes && assignment.notes.includes('[Crop ID: ')) {
      const cropIdMatch = assignment.notes.match(/\[Crop ID:\s*([^\]]+)\]/);
      if (cropIdMatch && cropIdMatch[1]) {
        const rawCropId = cropIdMatch[1].trim();
        await this.prisma.cropCycle.updateMany({
          where: {
            OR: [{ id: rawCropId }, { cropId: rawCropId }],
            deletedAt: null,
          },
          data: {
            assignedAdvisorId: user.id,
            advisorReviewStatus: 'ACCEPTED' as any,
            advisorAcceptedAt: new Date(),
          },
        });
      }
    }

    await this.payoutAdvisorShareOnAccept(assignment.farmerId, user.id);
    await this.notificationsService.create(
      assignment.farmerId,
      NotificationType.SYSTEM,
      '👨‍⚕️ Doctor Working on Request',
      `Dr. ${user.name} has accepted your hire request and is actively working on your farm advisory.`,
      { advisorId: user.id, status: 'WORKING' },
    );
    // Instant WhatsApp Group Sync (auto-add farmer)
    this.whatsAppGroupSyncService.syncSingleFarmerGroupStatus(assignment.farmerId).catch(() => {});
    return updated;
  }

  /** Credits the advisor's wallet for the farmer's currently-active STANDARD/PREMIUM plan, prorated by days remaining. */
  private async payoutAdvisorShareOnAccept(farmerId: string, advisorId: string) {
    const plan = await this.prisma.farmerPlan.findUnique({ where: { farmerId } });
    if (!plan?.endDate || plan.endDate <= new Date()) return;
    if (plan.plan === FarmerSubscriptionPlan.FREE) return;

    const pricing = await this.prisma.farmerPlanPricing.findFirst({ where: { plan: plan.plan } });
    if (!pricing?.advisorShareValue) return;

    const daysRemaining = Math.ceil((plan.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    const ratio = daysRemaining / pricing.billingPeriodDays;
    const amount = Math.round(Number(pricing.advisorShareValue) * ratio * 100) / 100;
    if (amount <= 0) return;

    const farmer = await this.prisma.user.findUnique({ where: { id: farmerId }, select: { name: true, kingId: true } });
    const advisor = await this.prisma.user.findUnique({ where: { id: advisorId }, select: { id: true, seniorDoctorId: true, name: true } });
    const recipientId = advisor?.seniorDoctorId || advisorId;
    const farmerLabel = farmer ? `${farmer.name}${farmer.kingId ? ` (ID: ${farmer.kingId})` : ''}` : 'a farmer';
    const advisorLabel = advisor?.seniorDoctorId ? ` (via Assistant Doctor ${advisor.name})` : '';

    await this.walletService.credit(
      recipientId,
      amount,
      `Advisor fee for ${plan.plan} plan — accepted ${farmerLabel}${advisorLabel} on ${new Date().toLocaleDateString('en-IN')}`,
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
    // Instant WhatsApp Group Sync (auto-remove if previously added)
    this.whatsAppGroupSyncService.syncSingleFarmerGroupStatus(assignment.farmerId).catch(() => {});
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
    const assignment = await this.findOneOrThrow(user, id);
    const updated = await this.prisma.advisorAssignment.update({
      where: { id },
      data: { status: AdvisorAssignmentStatus.REVOKED, endDate: new Date() },
    });
    // Instant WhatsApp Group Sync (auto-remove farmer)
    this.whatsAppGroupSyncService.syncSingleFarmerGroupStatus(assignment.farmerId).catch(() => {});
    return updated;
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

  /**
   * Advisor creates or updates their custom advisory plan.
   * Plan is set to PENDING_APPROVAL and must be approved by Admin before becoming live.
   */
  async createOrUpdateAdvisorPlan(advisorUser: AuthUser, dto: any) {
    const existing = await this.prisma.advisorPlan.findFirst({
      where: {
        advisorId: advisorUser.id,
        hiringModel: dto.hiringModel,
      },
    });

    let plan;
    if (existing) {
      plan = await this.prisma.advisorPlan.update({
        where: { id: existing.id },
        data: {
          name: dto.name,
          description: dto.description,
          price: dto.price,
          billingCycle: dto.billingCycle || 'MONTHLY',
          callRequestLimit: dto.callRequestLimit ?? 5,
          inAppCallLimit: dto.inAppCallLimit ?? 3,
          videoCallAllowed: dto.videoCallAllowed ?? false,
          videoCallLimit: dto.videoCallLimit ?? 0,
          chatEnabled: dto.chatEnabled ?? true,
          approvalStatus: 'PENDING_APPROVAL',
          adminNotes: null,
          isActive: true,
        },
      });
    } else {
      plan = await this.prisma.advisorPlan.create({
        data: {
          advisorId: advisorUser.id,
          name: dto.name,
          description: dto.description,
          hiringModel: dto.hiringModel,
          price: dto.price,
          billingCycle: dto.billingCycle || 'MONTHLY',
          callRequestLimit: dto.callRequestLimit ?? 5,
          inAppCallLimit: dto.inAppCallLimit ?? 3,
          videoCallAllowed: dto.videoCallAllowed ?? false,
          videoCallLimit: dto.videoCallLimit ?? 0,
          chatEnabled: dto.chatEnabled ?? true,
          approvalStatus: 'PENDING_APPROVAL',
          isActive: true,
        },
      });
    }

    // Notify Super Admins & Admins
    const admins = await this.prisma.user.findMany({
      where: {
        OR: [{ role: Role.ADMIN }, { role: Role.SUPER_ADMIN }],
        deletedAt: null,
      },
      select: { id: true },
    });

    for (const admin of admins) {
      await this.notificationsService.create(
        admin.id,
        NotificationType.SYSTEM,
        'Advisor Plan Pending Approval 📋',
        `Doctor ${advisorUser.name} submitted a ${dto.hiringModel} plan (${dto.name} - ₹${dto.price}) for Admin review and approval.`,
        { planId: plan.id, advisorId: advisorUser.id, type: 'ADVISOR_PLAN_PENDING' },
      ).catch(() => {});
    }

    return plan;
  }

  /**
   * Advisor gets all their created plans with approval statuses
   */
  async getMyAdvisorPlans(advisorUser: AuthUser) {
    return this.prisma.advisorPlan.findMany({
      where: { advisorId: advisorUser.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Public/Farmer: get approved active plans of a doctor
   */
  async getDoctorApprovedPlans(advisorId: string) {
    return this.prisma.advisorPlan.findMany({
      where: {
        advisorId,
        approvalStatus: 'APPROVED',
        isActive: true,
      },
      orderBy: { price: 'asc' },
    });
  }

  /**
   * Admin: get all pending advisor plan submissions
   */
  async getPendingAdvisorPlansForAdmin() {
    const plans = await this.prisma.advisorPlan.findMany({
      where: { approvalStatus: 'PENDING_APPROVAL' },
      orderBy: { createdAt: 'desc' },
    });

    const advisorIds = [...new Set(plans.map((p) => p.advisorId).filter(Boolean))] as string[];
    const advisors = await this.prisma.user.findMany({
      where: { id: { in: advisorIds } },
      select: {
        id: true,
        name: true,
        mobile: true,
        kingId: true,
        specialization: true,
        photoUrl: true,
      },
    });
    const advMap = new Map(advisors.map((a) => [a.id, a]));

    return plans.map((p) => ({
      ...p,
      advisor: p.advisorId ? advMap.get(p.advisorId) : null,
    }));
  }

  /**
   * Admin: Approve advisor plan with optional modifications
   */
  async adminApproveAdvisorPlan(adminUser: AuthUser, planId: string, modifications?: any) {
    const plan = await this.prisma.advisorPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      throw new NotFoundException('Advisor plan not found.');
    }

    const updated = await this.prisma.advisorPlan.update({
      where: { id: planId },
      data: {
        approvalStatus: 'APPROVED',
        isActive: true,
        reviewedById: adminUser.id,
        reviewedAt: new Date(),
        adminNotes: modifications?.adminNotes ?? plan.adminNotes,
        ...(modifications?.price !== undefined ? { price: modifications.price } : {}),
        ...(modifications?.callRequestLimit !== undefined ? { callRequestLimit: modifications.callRequestLimit } : {}),
        ...(modifications?.inAppCallLimit !== undefined ? { inAppCallLimit: modifications.inAppCallLimit } : {}),
        ...(modifications?.videoCallAllowed !== undefined ? { videoCallAllowed: modifications.videoCallAllowed } : {}),
        ...(modifications?.videoCallLimit !== undefined ? { videoCallLimit: modifications.videoCallLimit } : {}),
        ...(modifications?.chatEnabled !== undefined ? { chatEnabled: modifications.chatEnabled } : {}),
      },
    });

    // Notify Advisor
    if (plan.advisorId) {
      // Sync fee to user profile
      const userUpdate: any = {};
      if (plan.hiringModel === 'MONTHLY_SUBSCRIPTION') {
        userUpdate.feeVipMonthly = updated.price;
      } else if (plan.hiringModel === 'PER_CROP') {
        userUpdate.feePerCropSeason = updated.price;
      } else if (plan.hiringModel === 'PAY_PER_CONSULTATION') {
        userUpdate.feePerConsultation = updated.price;
      }
      if (Object.keys(userUpdate).length > 0) {
        await this.prisma.user.update({
          where: { id: plan.advisorId },
          data: userUpdate,
        }).catch(() => {});
      }

      await this.notificationsService.create(
        plan.advisorId,
        NotificationType.SYSTEM,
        'Plan Approved by Admin ✅',
        `Your advisory plan "${updated.name}" has been approved by FarmsKing Admin and is now LIVE for farmers to subscribe.`,
        { planId: updated.id, type: 'ADVISOR_PLAN_APPROVED' },
      ).catch(() => {});
    }

    return updated;
  }

  /**
   * Admin: Reject advisor plan with reason
   */
  async adminRejectAdvisorPlan(adminUser: AuthUser, planId: string, reason?: string) {
    const plan = await this.prisma.advisorPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      throw new NotFoundException('Advisor plan not found.');
    }

    const updated = await this.prisma.advisorPlan.update({
      where: { id: planId },
      data: {
        approvalStatus: 'REJECTED',
        isActive: false,
        reviewedById: adminUser.id,
        reviewedAt: new Date(),
        adminNotes: reason || 'Plan rejected by admin.',
      },
    });

    if (plan.advisorId) {
      await this.notificationsService.create(
        plan.advisorId,
        NotificationType.SYSTEM,
        'Plan Rejected by Admin ❌',
        `Your advisory plan "${plan.name}" was rejected by Admin. Reason: ${reason || 'Does not meet platform guidelines.'}`,
        { planId: plan.id, type: 'ADVISOR_PLAN_REJECTED' },
      ).catch(() => {});
    }

    return updated;
  }

  /**
   * Fetch complete Doctor Settings & Communication Channels
   */
  async getDoctorSettings(user: AuthUser, targetAdvisorId?: string) {
    const advisorId = targetAdvisorId || user.id;
    const advisor = await this.prisma.user.findUnique({
      where: { id: advisorId },
      select: {
        id: true,
        name: true,
        mobile: true,
        kingId: true,
        photoUrl: true,
        qualification: true,
        profileTitle: true,
        specialization: true,
        bio: true,
        feePerConsultation: true,
        feePerCropSeason: true,
        feeVipMonthly: true,
        specializedCrops: true,
        canTakeCalls: true,
        whatsappGroupEnabled: true,
        createdAt: true,
      },
    });

    if (!advisor) {
      throw new NotFoundException('Advisor not found.');
    }

    const appSetting = await this.appSettingsService.get();
    const storedDoctorSettings = (appSetting.featureFlags as any)?.doctorSettings?.[advisorId] || {};

    return {
      advisorId,
      advisorName: advisor.name,
      advisorMobile: advisor.mobile,
      advisorKingId: advisor.kingId,

      // 1. Contact Privacy & Channels
      showMobileNumber: storedDoctorSettings.showMobileNumber ?? false,
      enableWhatsApp: storedDoctorSettings.enableWhatsApp ?? (advisor.whatsappGroupEnabled ?? true),
      enableGsmCalling: storedDoctorSettings.enableGsmCalling ?? (advisor.canTakeCalls ?? false),
      enableInAppAudioCall: storedDoctorSettings.enableInAppAudioCall ?? true,
      enableVideoCall: storedDoctorSettings.enableVideoCall ?? true,

      // 2. Plans & Pricing
      monthlyPlanEnabled: storedDoctorSettings.monthlyPlanEnabled ?? true,
      monthlyFee: storedDoctorSettings.monthlyPlan1Fee ?? storedDoctorSettings.monthlyFee ?? Number(advisor.feeVipMonthly ?? 299),
      monthlyCallLimit: storedDoctorSettings.monthlyCallLimit ?? 5,
      monthlyInAppCallLimit: storedDoctorSettings.monthlyInAppCallLimit ?? 3,
      monthlyVideoCallLimit: storedDoctorSettings.monthlyVideoCallLimit ?? 2,
      monthlyVideoAllowed: storedDoctorSettings.monthlyVideoAllowed ?? true,
      monthlyChatEnabled: storedDoctorSettings.monthlyChatEnabled ?? true,

      // 3 Distinct Monthly Tier Plans
      monthlyPlan1Enabled: storedDoctorSettings.monthlyPlan1Enabled ?? true,
      monthlyPlan1Name: storedDoctorSettings.monthlyPlan1Name ?? 'Basic Starter Care',
      monthlyPlan1Fee: storedDoctorSettings.monthlyPlan1Fee ?? Number(advisor.feeVipMonthly ?? 299),
      monthlyPlan1Features: storedDoctorSettings.monthlyPlan1Features ?? '1 Crop Supervised · 3 VoIP Calls / mo · Weekly Advisory · In-App Chat',
      monthlyPlan1CropsLimit: storedDoctorSettings.monthlyPlan1CropsLimit ?? 1,
      monthlyPlan1CallLimit: storedDoctorSettings.monthlyPlan1CallLimit ?? 3,
      monthlyPlan1VideoAllowed: storedDoctorSettings.monthlyPlan1VideoAllowed ?? false,

      monthlyPlan2Enabled: storedDoctorSettings.monthlyPlan2Enabled ?? true,
      monthlyPlan2Name: storedDoctorSettings.monthlyPlan2Name ?? 'Standard Pro Care',
      monthlyPlan2Fee: storedDoctorSettings.monthlyPlan2Fee ?? 599,
      monthlyPlan2Features: storedDoctorSettings.monthlyPlan2Features ?? 'Up to 3 Crops · 8 VoIP Calls / mo · 2 Video Inspections · Priority Problem Resolution',
      monthlyPlan2CropsLimit: storedDoctorSettings.monthlyPlan2CropsLimit ?? 3,
      monthlyPlan2CallLimit: storedDoctorSettings.monthlyPlan2CallLimit ?? 8,
      monthlyPlan2VideoAllowed: storedDoctorSettings.monthlyPlan2VideoAllowed ?? true,

      monthlyPlan3Enabled: storedDoctorSettings.monthlyPlan3Enabled ?? true,
      monthlyPlan3Name: storedDoctorSettings.monthlyPlan3Name ?? 'Complete Farm VIP',
      monthlyPlan3Fee: storedDoctorSettings.monthlyPlan3Fee ?? 999,
      monthlyPlan3Features: storedDoctorSettings.monthlyPlan3Features ?? 'All Crops (Up to 5) · 15 VoIP Calls / mo · Unlimited Video Diagnostics · 24/7 Priority Hotline',
      monthlyPlan3CropsLimit: storedDoctorSettings.monthlyPlan3CropsLimit ?? 5,
      monthlyPlan3CallLimit: storedDoctorSettings.monthlyPlan3CallLimit ?? 15,
      monthlyPlan3VideoAllowed: storedDoctorSettings.monthlyPlan3VideoAllowed ?? true,

      // Duration Discounts (%)
      discount3Months: storedDoctorSettings.discount3Months ?? 10,
      discount6Months: storedDoctorSettings.discount6Months ?? 15,
      discount12Months: storedDoctorSettings.discount12Months ?? 25,

      plan1Discount3Months: storedDoctorSettings.plan1Discount3Months ?? storedDoctorSettings.discount3Months ?? 10,
      plan1Discount6Months: storedDoctorSettings.plan1Discount6Months ?? storedDoctorSettings.discount6Months ?? 15,
      plan1Discount12Months: storedDoctorSettings.plan1Discount12Months ?? storedDoctorSettings.discount12Months ?? 25,

      plan2Discount3Months: storedDoctorSettings.plan2Discount3Months ?? storedDoctorSettings.discount3Months ?? 10,
      plan2Discount6Months: storedDoctorSettings.plan2Discount6Months ?? storedDoctorSettings.discount6Months ?? 15,
      plan2Discount12Months: storedDoctorSettings.plan2Discount12Months ?? storedDoctorSettings.discount12Months ?? 25,

      plan3Discount3Months: storedDoctorSettings.plan3Discount3Months ?? storedDoctorSettings.discount3Months ?? 10,
      plan3Discount6Months: storedDoctorSettings.plan3Discount6Months ?? storedDoctorSettings.discount6Months ?? 15,
      plan3Discount12Months: storedDoctorSettings.plan3Discount12Months ?? storedDoctorSettings.discount12Months ?? 25,

      // 3-Month Pack (Derived from 1-mo fee and discount % if not explicitly locked)
      plan3MonthsEnabled: storedDoctorSettings.plan3MonthsEnabled ?? true,
      fee3Months: storedDoctorSettings.fee3Months ?? (Math.round(Number(storedDoctorSettings.monthlyPlan1Fee ?? advisor.feeVipMonthly ?? 299) * 3 * (1 - (storedDoctorSettings.discount3Months ?? 10) / 100))),
      callLimit3Months: storedDoctorSettings.callLimit3Months ?? 15,
      videoAllowed3Months: storedDoctorSettings.videoAllowed3Months ?? true,

      // 6-Month Pack
      plan6MonthsEnabled: storedDoctorSettings.plan6MonthsEnabled ?? true,
      fee6Months: storedDoctorSettings.fee6Months ?? (Math.round(Number(storedDoctorSettings.monthlyPlan1Fee ?? advisor.feeVipMonthly ?? 299) * 6 * (1 - (storedDoctorSettings.discount6Months ?? 15) / 100))),
      callLimit6Months: storedDoctorSettings.callLimit6Months ?? 30,
      videoAllowed6Months: storedDoctorSettings.videoAllowed6Months ?? true,

      // 12-Month Annual Pack
      plan12MonthsEnabled: storedDoctorSettings.plan12MonthsEnabled ?? true,
      fee12Months: storedDoctorSettings.fee12Months ?? (Math.round(Number(storedDoctorSettings.monthlyPlan1Fee ?? advisor.feeVipMonthly ?? 299) * 12 * (1 - (storedDoctorSettings.discount12Months ?? 25) / 100))),
      callLimit12Months: storedDoctorSettings.callLimit12Months ?? 60,
      videoAllowed12Months: storedDoctorSettings.videoAllowed12Months ?? true,

      // Full Season Crop Care
      cropSeasonPlanEnabled: storedDoctorSettings.cropSeasonPlanEnabled ?? true,
      cropSeasonFee: storedDoctorSettings.cropSeasonFee ?? Number(advisor.feePerCropSeason ?? 499),
      cropSeasonCallLimit: storedDoctorSettings.cropSeasonCallLimit ?? 10,
      cropSeasonVideoAllowed: storedDoctorSettings.cropSeasonVideoAllowed ?? true,

      // Single Consultation / SOS
      singleConsultationPlanEnabled: storedDoctorSettings.singleConsultationPlanEnabled ?? true,
      singleConsultationFee: storedDoctorSettings.singleConsultationFee ?? Number(advisor.feePerConsultation ?? 150),
      allCropsSelected: storedDoctorSettings.allCropsSelected ?? false,
      specializedCrops: storedDoctorSettings.specializedCrops ?? advisor.specializedCrops ?? ['Wheat', 'Paddy / Rice', 'Basmati', 'Cotton', 'Mustard', 'Potato', 'Tomato'],
      freeConsultationEnabled: storedDoctorSettings.freeConsultationEnabled ?? false,

      // 3. Availability & Practice Timings
      availabilityStatus: storedDoctorSettings.availabilityStatus ?? 'AVAILABLE',
      workingHoursStart: storedDoctorSettings.workingHoursStart ?? '09:00 AM',
      workingHoursEnd: storedDoctorSettings.workingHoursEnd ?? '07:00 PM',
      emergencyConsultation: storedDoctorSettings.emergencyConsultation ?? true,
      welcomeGreeting: storedDoctorSettings.welcomeGreeting ?? 'Welcome to FarmsKing Agronomy Advisory. We are committed to protecting your crops and maximizing your yield.',

      // 4. Agronomy Credential & Prescriptions Signature
      icarRegistrationNumber: storedDoctorSettings.icarRegistrationNumber ?? '',
      qualificationTitle: storedDoctorSettings.qualificationTitle ?? advisor.qualification ?? 'Certified Crop Doctor',
      maxFarmerCapacity: storedDoctorSettings.maxFarmerCapacity ?? 100,

      // 5. Test Clearance & Eligibility Date
      certifiedAt: storedDoctorSettings.certifiedAt ?? advisor.createdAt.toISOString(),
      testPassedDate: storedDoctorSettings.testPassedDate ?? storedDoctorSettings.certifiedAt ?? advisor.createdAt.toISOString(),
    };
  }

  /**
   * Update Doctor Settings & Communication Channels
   */
  async updateDoctorSettings(user: AuthUser, dto: any, targetAdvisorId?: string) {
    const advisorId = targetAdvisorId || user.id;
    const advisor = await this.prisma.user.findUnique({ where: { id: advisorId } });
    if (!advisor) {
      throw new NotFoundException('Advisor not found.');
    }

    const appSetting = await this.appSettingsService.get();
    const existingFlags = (appSetting.featureFlags as any) || {};
    const existingDoctorSettings = existingFlags.doctorSettings || {};

    const baseMonthlyFee = Number(dto.monthlyPlan1Fee ?? dto.monthlyFee ?? existingDoctorSettings[advisorId]?.monthlyPlan1Fee ?? existingDoctorSettings[advisorId]?.monthlyFee ?? advisor.feeVipMonthly ?? 299);
    const d3 = Number(dto.discount3Months ?? existingDoctorSettings[advisorId]?.discount3Months ?? 10);
    const d6 = Number(dto.discount6Months ?? existingDoctorSettings[advisorId]?.discount6Months ?? 15);
    const d12 = Number(dto.discount12Months ?? existingDoctorSettings[advisorId]?.discount12Months ?? 25);

    const updatedSetting = {
      ...(existingDoctorSettings[advisorId] || {}),
      ...dto,
      certifiedAt: dto.certifiedAt || existingDoctorSettings[advisorId]?.certifiedAt || advisor.createdAt.toISOString(),
      testPassedDate: dto.testPassedDate || dto.certifiedAt || existingDoctorSettings[advisorId]?.testPassedDate || advisor.createdAt.toISOString(),
      monthlyFee: dto.monthlyPlan1Fee ?? dto.monthlyFee ?? existingDoctorSettings[advisorId]?.monthlyFee ?? baseMonthlyFee,
      fee3Months: dto.fee3Months ?? Math.round(baseMonthlyFee * 3 * (1 - d3 / 100)),
      fee6Months: dto.fee6Months ?? Math.round(baseMonthlyFee * 6 * (1 - d6 / 100)),
      fee12Months: dto.fee12Months ?? Math.round(baseMonthlyFee * 12 * (1 - d12 / 100)),
      updatedAt: new Date().toISOString(),
    };

    const newFlags = {
      ...existingFlags,
      doctorSettings: {
        ...existingDoctorSettings,
        [advisorId]: updatedSetting,
      },
    };

    await this.prisma.appSetting.update({
      where: { id: 'default' },
      data: { featureFlags: newFlags },
    });

    // Synchronize to User Profile fields
    const userUpdate: any = {};
    if (dto.singleConsultationFee !== undefined) userUpdate.feePerConsultation = dto.singleConsultationFee;
    if (dto.cropSeasonFee !== undefined) userUpdate.feePerCropSeason = dto.cropSeasonFee;
    if (dto.monthlyFee !== undefined) userUpdate.feeVipMonthly = dto.monthlyFee;
    if (dto.specializedCrops !== undefined) userUpdate.specializedCrops = dto.specializedCrops;
    if (dto.qualificationTitle !== undefined) userUpdate.qualification = dto.qualificationTitle;
    if (dto.enableWhatsApp !== undefined) userUpdate.whatsappGroupEnabled = dto.enableWhatsApp;
    if (dto.enableGsmCalling !== undefined || dto.enableInAppAudioCall !== undefined) {
      userUpdate.canTakeCalls = Boolean(dto.enableGsmCalling || dto.enableInAppAudioCall);
    }

    if (Object.keys(userUpdate).length > 0) {
      await this.prisma.user.update({
        where: { id: advisorId },
        data: userUpdate,
      }).catch(() => {});
    }

    return this.getDoctorSettings(user, advisorId);
  }
}
