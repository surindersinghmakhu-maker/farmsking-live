import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AdvisorAssignmentStatus, CropAdvisorReviewStatus, CropCycleStage, CropStatus, FarmerSubscriptionPlan, NotificationType, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PlotsService } from '../plots/plots.service';
import {
  FarmerPlansService,
  FREE_PLAN_MAX_ACTIVE_CROPS,
  FREE_PLAN_MAX_CROPS,
  PREMIUM_PLAN_MAX_ADVISOR_CROPS,
  STANDARD_PLAN_MAX_ADVISOR_CROPS,
} from '../farmer-plans/farmer-plans.service';
import { AdvisorAssignmentService } from '../advisor-assignment/advisor-assignment.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { generateUniqueCropId } from '../../common/utils/crop-id.util';
import { CreateCropDto } from './dto/create-crop.dto';
import { UpdateCropDto } from './dto/update-crop.dto';

const DATE_FIELDS = ['sowingDate', 'transplantDate', 'expectedHarvestDate', 'actualHarvestDate'] as const;

/** Statuses that count as "active" (non-completed) for FREE plan limit check */
const ACTIVE_STATUSES: CropStatus[] = [
  CropStatus.PLANNED,
  CropStatus.ACTIVE,
  CropStatus.HARVESTING,
];

/** Derives the coarse CropStatus from the farmer-facing granular stage, when stage is provided and status isn't explicitly set. */
function statusForStage(stage: CropCycleStage): CropStatus {
  if (stage === CropCycleStage.COMPLETED) return CropStatus.COMPLETED;
  if (stage === CropCycleStage.HARVESTING) return CropStatus.HARVESTING;
  return CropStatus.ACTIVE;
}

function toDateFields<T extends Partial<Record<(typeof DATE_FIELDS)[number], string>>>(dto: T) {
  const result: Record<string, Date> = {};
  for (const field of DATE_FIELDS) {
    const value = dto[field];
    if (value) {
      result[field] = new Date(value);
    }
  }
  return result;
}

@Injectable()
export class CropsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plotsService: PlotsService,
    private readonly farmerPlansService: FarmerPlansService,
    private readonly advisorAssignmentService: AdvisorAssignmentService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** The farmer's Advance Profile (photo, spray tank size, soil/water type) — an advisor needs these to give useful advice. */
  private async assertAdvanceProfileComplete(farmerId: string) {
    const farmer = await this.prisma.user.findUnique({
      where: { id: farmerId },
      select: { photoUrl: true, sprayTankSizeL: true, soilType: true, waterType: true },
    });
    const isComplete = !!(farmer?.photoUrl && farmer?.sprayTankSizeL && farmer?.soilType && farmer?.waterType);
    if (!isComplete) {
      throw new ForbiddenException('Complete your Advance Profile (photo, spray tank size, soil & water type) before adding a crop.');
    }
  }

  async create(user: AuthUser, dto: CreateCropDto) {
    // Verifies the plot exists and belongs to this user (or ADMIN) before allowing a crop cycle on it.
    await this.plotsService.findOneOrThrow(user, dto.plotId);

    if (user.role === Role.FARMER) {
      await this.assertAdvanceProfileComplete(user.id);
    }

    // ── FREE plan enforcement ──────────────────────────────────────────────
    if (user.role === Role.FARMER) {
      const { plan } = await this.farmerPlansService.getEffectivePlan(user.id);

      if (plan === FarmerSubscriptionPlan.FREE) {
        // Count total crops across all plots of this farmer (non-deleted)
        const totalCrops = await this.prisma.cropCycle.count({
          where: {
            deletedAt: null,
            plot: { farm: { ownerId: user.id, deletedAt: null } },
          },
        });
        if (totalCrops >= FREE_PLAN_MAX_CROPS) {
          throw new ForbiddenException(
            `Free plan mein sirf ${FREE_PLAN_MAX_CROPS} crops add ho sakti hain. ` +
              `Adhik crops ke liye BASIC ya PREMIUM plan len.`,
          );
        }

        // Count active (non-completed) crops
        const activeCrops = await this.prisma.cropCycle.count({
          where: {
            deletedAt: null,
            status: { in: ACTIVE_STATUSES },
            plot: { farm: { ownerId: user.id, deletedAt: null } },
          },
        });
        if (activeCrops >= FREE_PLAN_MAX_ACTIVE_CROPS) {
          throw new ForbiddenException(
            `Free plan mein ek baar mein sirf ${FREE_PLAN_MAX_ACTIVE_CROPS} active crops ho sakti hain. ` +
              `Koi crop complete karein ya BASIC/PREMIUM plan len.`,
          );
        }
      }
    }
    // ── End FREE plan enforcement ──────────────────────────────────────────

    const { plotId, sowingDate, transplantDate, expectedHarvestDate, actualHarvestDate, ...rest } = dto;
    const cropId = await generateUniqueCropId(this.prisma);
    return this.prisma.cropCycle.create({
      data: {
        ...rest,
        cropId,
        plotId,
        status: dto.status ?? (dto.stage ? statusForStage(dto.stage) : undefined),
        ...toDateFields(dto),
      },
    });
  }

  /** Farmer: every active crop cycle across all their own farms/plots (for pickers that need a real crop, not a per-plot list). */
  listMineForFarmer(user: AuthUser) {
    return this.prisma.cropCycle.findMany({
      where: {
        deletedAt: null,
        plot: { farm: { ownerId: user.id, deletedAt: null } },
      },
      include: { plot: { select: { id: true, name: true, farmId: true, area: true, areaUnit: true, irrigationType: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllForPlot(user: AuthUser, plotId: string) {
    return this.plotsService.findOneOrThrow(user, plotId).then(() =>
      this.prisma.cropCycle.findMany({
        where: { plotId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  /** Admin/Super Admin: resolve a crop's short public Crop ID (e.g. "CR-482910") to its full record, for support/edit lookups. */
  async lookupByCropId(cropId: string) {
    const cropCycle = await this.prisma.cropCycle.findFirst({
      where: { cropId: cropId.toUpperCase(), deletedAt: null },
      include: {
        plot: {
          include: {
            farm: { include: { owner: { select: { id: true, name: true, kingId: true, mobile: true } } } },
          },
        },
      },
    });
    if (!cropCycle) {
      throw new NotFoundException('No crop found with this Crop ID.');
    }
    return cropCycle;
  }

  async findOneOrThrow(user: AuthUser, id: string) {
    const cropCycle = await this.prisma.cropCycle.findFirst({
      where: { id, deletedAt: null },
      include: { plot: { include: { farm: true } } },
    });

    if (!cropCycle || (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN && cropCycle.plot.farm.ownerId !== user.id)) {
      throw new NotFoundException('Crop cycle not found.');
    }

    // ── FREE plan gate for completed crop details ──────────────────────────
    if (
      user.role === Role.FARMER &&
      cropCycle.status === CropStatus.COMPLETED
    ) {
      const { plan } = await this.farmerPlansService.getEffectivePlan(user.id);
      if (plan === FarmerSubscriptionPlan.FREE) {
        // Return the crop with a planGated flag — full details are locked
        return {
          ...cropCycle,
          planGated: true,
          planGatedMessage:
            'Completed crop ki poori jaankari ke liye BASIC ya PREMIUM plan len. Coupon code se activate karein.',
        };
      }
    }
    // ── End plan gate ──────────────────────────────────────────────────────

    return cropCycle;
  }

  async update(user: AuthUser, id: string, dto: UpdateCropDto) {
    const cropCycle = await this.findOneOrThrow(user, id);
    if (cropCycle.status === CropStatus.COMPLETED) {
      throw new ForbiddenException('This crop is completed and locked — no further changes allowed.');
    }
    const { sowingDate, transplantDate, expectedHarvestDate, actualHarvestDate, ...rest } = dto;
    return this.prisma.cropCycle.update({
      where: { id },
      data: {
        ...rest,
        status: dto.status ?? (dto.stage ? statusForStage(dto.stage) : undefined),
        ...toDateFields(dto),
      },
    });
  }

  async remove(user: AuthUser, id: string) {
    await this.findOneOrThrow(user, id);
    return this.prisma.cropCycle.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  /** Farmer sends a crop to their assigned advisor for review. */
  async submitToAdvisor(user: AuthUser, id: string) {
    await this.findOneOrThrow(user, id);

    const assignment = await this.prisma.advisorAssignment.findFirst({
      where: { farmerId: user.id, status: AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
    });
    if (!assignment) {
      throw new BadRequestException('You need an assigned advisor before submitting a crop for review.');
    }

    const { plan } = await this.farmerPlansService.getEffectivePlan(user.id);
    const maxAdvisorCrops =
      plan === FarmerSubscriptionPlan.STANDARD
        ? STANDARD_PLAN_MAX_ADVISOR_CROPS
        : plan === FarmerSubscriptionPlan.PREMIUM
          ? PREMIUM_PLAN_MAX_ADVISOR_CROPS
          : null;
    if (maxAdvisorCrops !== null) {
      const activeAdvisorCrops = await this.prisma.cropCycle.count({
        where: {
          deletedAt: null,
          status: { notIn: [CropStatus.COMPLETED, CropStatus.FAILED] },
          advisorReviewStatus: { in: [CropAdvisorReviewStatus.PENDING, CropAdvisorReviewStatus.ACCEPTED] },
          plot: { farm: { ownerId: user.id } },
        },
      });
      if (activeAdvisorCrops >= maxAdvisorCrops) {
        throw new ForbiddenException(
          `The ${plan} plan allows up to ${maxAdvisorCrops} crops under active advisor review at once.`,
        );
      }
    }

    const updated = await this.prisma.cropCycle.update({
      where: { id },
      data: {
        advisorReviewStatus: CropAdvisorReviewStatus.PENDING,
        submittedToAdvisorAt: new Date(),
        advisorAcceptedAt: null,
      },
    });

    await this.notificationsService.create(
      assignment.advisorId,
      NotificationType.SYSTEM,
      'New crop submitted for review',
      `${user.name} sent "${updated.cropName}" for your review. Accept it to add it to your roster.`,
      { cropCycleId: updated.id, farmerId: user.id },
    );

    return updated;
  }

  /** Farmer cancels their own still-PENDING crop submission before the advisor responds — frees up their advisor-review slot immediately. */
  async cancelSubmission(user: AuthUser, id: string) {
    const cropCycle = await this.findOneOrThrow(user, id);
    if (cropCycle.advisorReviewStatus !== CropAdvisorReviewStatus.PENDING) {
      throw new BadRequestException('Only a request still awaiting your advisor\'s response can be cancelled.');
    }

    return this.prisma.cropCycle.update({
      where: { id },
      data: { advisorReviewStatus: CropAdvisorReviewStatus.NONE, submittedToAdvisorAt: null, advisorAcceptedAt: null },
    });
  }

  /** Advisor accepts a farmer's submitted crop — the crop shows up as accepted in the advisor's roster. */
  async acceptByAdvisor(user: AuthUser, id: string) {
    const cropCycle = await this.prisma.cropCycle.findFirst({
      where: { id, deletedAt: null },
      include: { plot: { include: { farm: true } } },
    });
    if (!cropCycle) {
      throw new NotFoundException('Crop cycle not found.');
    }
    if (cropCycle.advisorReviewStatus !== CropAdvisorReviewStatus.PENDING) {
      throw new BadRequestException('This crop has not been submitted for review.');
    }

    await this.assertAdvanceProfileComplete(cropCycle.plot.farm.ownerId);
    await this.advisorAssignmentService.assertAdvisorAssignedToFarmer(user.id, cropCycle.plot.farm.ownerId);

    return this.prisma.cropCycle.update({
      where: { id },
      data: { advisorReviewStatus: CropAdvisorReviewStatus.ACCEPTED, advisorAcceptedAt: new Date() },
    });
  }

  /** Sets/updates the day-wise advisory schedule text for an accepted crop — the assigned advisor writes the plan; the owning farmer can mark individual tasks done/skipped on it. */
  async updateAssignedSchedule(user: AuthUser, id: string, assignedSchedule: string) {
    const cropCycle = await this.prisma.cropCycle.findFirst({
      where: { id, deletedAt: null },
      include: { plot: { include: { farm: true } } },
    });
    if (!cropCycle) {
      throw new NotFoundException('Crop cycle not found.');
    }
    if (cropCycle.advisorReviewStatus !== CropAdvisorReviewStatus.ACCEPTED) {
      throw new BadRequestException('You can only schedule crops that are under active advisor review.');
    }

    if (user.role === Role.ADVISOR) {
      await this.advisorAssignmentService.assertAdvisorAssignedToFarmer(user.id, cropCycle.plot.farm.ownerId);
    } else if (cropCycle.plot.farm.ownerId !== user.id && user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN) {
      throw new NotFoundException('Crop cycle not found.');
    }

    return this.prisma.cropCycle.update({ where: { id }, data: { assignedSchedule } });
  }

  /** Advisor rejects a farmer's submitted crop — reverts it to NONE so the farmer can fix it up and resubmit. */
  async rejectByAdvisor(user: AuthUser, id: string, reason?: string) {
    const cropCycle = await this.prisma.cropCycle.findFirst({
      where: { id, deletedAt: null },
      include: { plot: { include: { farm: true } } },
    });
    if (!cropCycle) {
      throw new NotFoundException('Crop cycle not found.');
    }
    if (cropCycle.advisorReviewStatus !== CropAdvisorReviewStatus.PENDING) {
      throw new BadRequestException('This crop has not been submitted for review.');
    }
    await this.advisorAssignmentService.assertAdvisorAssignedToFarmer(user.id, cropCycle.plot.farm.ownerId);

    const updated = await this.prisma.cropCycle.update({
      where: { id },
      data: { advisorReviewStatus: CropAdvisorReviewStatus.NONE, submittedToAdvisorAt: null, advisorAcceptedAt: null },
    });

    await this.notificationsService.create(
      cropCycle.plot.farm.ownerId,
      NotificationType.SYSTEM,
      'Crop submission rejected',
      `Your advisor did not accept "${cropCycle.cropName}" for review${reason ? `: ${reason}.` : '.'} Please review and resubmit.`,
      { cropCycleId: id, advisorId: user.id },
    );

    return updated;
  }

  /** Advisor's list of crops pending their review, across all currently-assigned farmers. */
  async listPendingForAdvisor(user: AuthUser) {
    const assignments = await this.prisma.advisorAssignment.findMany({
      where: { advisorId: user.id, status: AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
      select: { farmerId: true },
    });
    const farmerIds = assignments.map((a) => a.farmerId);
    if (farmerIds.length === 0) return [];

    return this.prisma.cropCycle.findMany({
      where: {
        deletedAt: null,
        advisorReviewStatus: CropAdvisorReviewStatus.PENDING,
        plot: { farm: { ownerId: { in: farmerIds } } },
      },
      include: {
        plot: {
          include: {
            farm: {
              select: {
                id: true,
                name: true,
                ownerId: true,
                owner: { select: { name: true, mobile: true, village: true, district: true, state: true, sprayTankSizeL: true } },
              },
            },
          },
        },
      },
      orderBy: { submittedToAdvisorAt: 'desc' },
    });
  }

  /** Advisor's list of crops they've already accepted, across all currently-assigned farmers. */
  async listAcceptedForAdvisor(user: AuthUser) {
    const assignments = await this.prisma.advisorAssignment.findMany({
      where: { advisorId: user.id, status: AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
      select: { farmerId: true },
    });
    const farmerIds = assignments.map((a) => a.farmerId);
    if (farmerIds.length === 0) return [];

    return this.prisma.cropCycle.findMany({
      where: {
        deletedAt: null,
        advisorReviewStatus: CropAdvisorReviewStatus.ACCEPTED,
        plot: { farm: { ownerId: { in: farmerIds } } },
      },
      include: {
        plot: {
          include: {
            farm: {
              select: {
                id: true,
                name: true,
                ownerId: true,
                owner: { select: { name: true, mobile: true, village: true, district: true, state: true, sprayTankSizeL: true } },
              },
            },
          },
        },
      },
      orderBy: { advisorAcceptedAt: 'desc' },
    });
  }
}
