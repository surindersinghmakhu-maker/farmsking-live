import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AdvisorAssignmentStatus, CropAdvisorReviewStatus, CropCycleStage, CropStatus, FarmerSubscriptionPlan, HiringModelType, NotificationType, Role, SubscriptionPlanStatus } from '@prisma/client';
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
import { getEffectiveFarmerId } from '../../common/utils/effective-farmer.util';
import { CreateCropDto } from './dto/create-crop.dto';
import { UpdateCropDto } from './dto/update-crop.dto';
import { SubmitCropToAdvisorDto } from './dto/submit-crop-to-advisor.dto';

const DATE_FIELDS = ['sowingDate', 'transplantDate', 'expectedHarvestDate', 'actualHarvestDate'] as const;

/** Statuses that count as "active" (non-completed) for FREE plan limit check */
const ACTIVE_STATUSES: CropStatus[] = [
  CropStatus.PLANNED,
  CropStatus.ACTIVE,
  CropStatus.HARVESTING,
];

/** Derives the coarse CropStatus from the farmer-facing granular stage, when stage is provided and status isn't explicitly set. */
function statusForStage(stage: CropCycleStage): CropStatus {
  if (stage === CropCycleStage.COMPLETED) return CropStatus.DEACTIVE;
  if (stage === CropCycleStage.HARVESTING) return CropStatus.HARVESTING;
  return CropStatus.ACTIVE;
}

function toDateFields<T extends Partial<Record<(typeof DATE_FIELDS)[number], string>>>(dto: T) {
  const result: Record<string, Date> = {};
  for (const field of DATE_FIELDS) {
    const value = dto[field];
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        result[field] = d;
      }
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

    // ── Dynamic Farmer Plan crop limit enforcement ──────────────────────────
    if (user.role === Role.FARMER) {
      const { plan } = await this.farmerPlansService.getEffectivePlan(user.id);

      // Fetch Super Admin configured limits for this plan
      const planPricing = await this.prisma.farmerPlanPricing.findFirst({
        where: { plan },
      });

      const maxTotalCrops = planPricing?.maxTotalCrops ?? (plan === FarmerSubscriptionPlan.FREE ? FREE_PLAN_MAX_CROPS : null);
      const maxActiveCrops = planPricing?.maxActiveCrops ?? (plan === FarmerSubscriptionPlan.FREE ? FREE_PLAN_MAX_ACTIVE_CROPS : null);

      // 1. Total Crops Allowed Enforcement (maxTotalCrops)
      if (maxTotalCrops != null && maxTotalCrops > 0) {
        const totalCrops = await this.prisma.cropCycle.count({
          where: {
            deletedAt: null,
            plot: { farm: { ownerId: user.id, deletedAt: null } },
          },
        });
        if (totalCrops >= maxTotalCrops) {
          const planName = plan === FarmerSubscriptionPlan.PRO ? 'Lite Plan' : plan === FarmerSubscriptionPlan.SMART ? 'Pro Plan' : (plan === FarmerSubscriptionPlan.SUPER || plan === FarmerSubscriptionPlan.VIP) ? 'Farmer VIP Card' : 'Free Plan';
          throw new ForbiddenException(
            `Your current plan (${planName}) allows adding a maximum of ${maxTotalCrops} crop(s). Please upgrade your plan to add more crops.`,
          );
        }
      }

      // 2. Active Crops Allowed Enforcement (maxActiveCrops)
      if (maxActiveCrops != null && maxActiveCrops > 0) {
        const activeCrops = await this.prisma.cropCycle.count({
          where: {
            deletedAt: null,
            status: { in: ACTIVE_STATUSES },
            plot: { farm: { ownerId: user.id, deletedAt: null } },
          },
        });
        if (activeCrops >= maxActiveCrops) {
          const planName = plan === FarmerSubscriptionPlan.PRO ? 'Lite Plan' : plan === FarmerSubscriptionPlan.SMART ? 'Pro Plan' : (plan === FarmerSubscriptionPlan.SUPER || plan === FarmerSubscriptionPlan.VIP) ? 'Farmer VIP Card' : 'Free Plan';
          throw new ForbiddenException(
            `Your current plan (${planName}) allows a maximum of ${maxActiveCrops} active crop(s) at a time. Please upgrade your plan to add more active crops.`,
          );
        }
      }
    }
    // ── End dynamic plan enforcement ───────────────────────────────────────

    try {
      const { plotId, sowingDate, transplantDate, expectedHarvestDate, actualHarvestDate, ...rest } = dto;
      const cropId = await generateUniqueCropId(this.prisma);
      return await this.prisma.cropCycle.create({
        data: {
          ...rest,
          cropId,
          plotId,
          status: dto.status ?? (dto.stage ? statusForStage(dto.stage) : undefined),
          ...toDateFields(dto),
        },
      });
    } catch (err: any) {
      console.error('[CropsService.create] Database error:', err);
      throw new BadRequestException(`Failed to create crop cycle: ${err?.message || 'Database error'}`);
    }
  }

  /** Farmer: every active crop cycle across all their own farms/plots (for pickers that need a real crop, not a per-plot list). */
  async listMineForFarmer(user: AuthUser) {
    if (!user?.id) return [];
    try {
      const isGlobalAdmin =
        user.role === Role.ADMIN ||
        user.role === Role.SUPER_ADMIN ||
        (Array.isArray(user.roles) && (user.roles.includes(Role.ADMIN) || user.roles.includes(Role.SUPER_ADMIN)));

      const ownerFarmerId = getEffectiveFarmerId(user);
      // 1. Fetch all plot IDs for farms owned by this user (or all plots if global admin)
      const userFarms = await this.prisma.farm.findMany({
        where: isGlobalAdmin ? { deletedAt: null } : { ownerId: ownerFarmerId, deletedAt: null },
        select: { id: true, plots: { where: { deletedAt: null }, select: { id: true } } },
      });

      const plotIds = userFarms.flatMap((f) => f.plots.map((p) => p.id));
      if (plotIds.length === 0) return [];

      // 2. Fetch all crop cycles for these plots directly by plotIds
      const crops = await this.prisma.cropCycle.findMany({
        where: {
          deletedAt: null,
          plotId: { in: plotIds },
        },
        include: {
          plot: true,
          assignedAdvisor: {
            select: {
              id: true,
              kingId: true,
              name: true,
              photoUrl: true,
              mobile: true,
              specialization: true,
              qualification: true,
              profileTitle: true,
              feePerConsultation: true,
              feePerCropSeason: true,
              feeVipMonthly: true,
              monthlyIncludedCrops: true,
              feeAdditionalCropMonthly: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (user.role === Role.FARMER) {
        const { plan } = await this.farmerPlansService.getEffectivePlan(user.id);
        if (plan === FarmerSubscriptionPlan.FREE) {
          let activeCount = 0;
          return crops.map((c) => {
            const isActiveStatus = ACTIVE_STATUSES.includes(c.status);
            if (isActiveStatus) {
              activeCount++;
              if (activeCount > FREE_PLAN_MAX_ACTIVE_CROPS) {
                return {
                  ...c,
                  isLockedByPlan: true,
                  lockedReason: 'Plan limit exceeded: Only your 3 latest crops are active on Free Plan. Upgrade plan to edit older crops.',
                };
              }
            }
            return { ...c, isLockedByPlan: false };
          });
        }
      }

      return crops || [];
    } catch (err: any) {
      console.error('[CropsService.listMineForFarmer] Safe fallback catch:', err);
      return [];
    }
  }

  findAllForPlot(user: AuthUser, plotId: string) {
    return this.plotsService.findOneOrThrow(user, plotId).then(() =>
      this.prisma.cropCycle.findMany({
        where: { plotId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  /** Admin/Super Admin: resolve a crop's short public Crop ID (e.g. "C-482910" or "482910") or UUID to its full record, for support/edit lookups. */
  async lookupByCropId(cropId: string) {
    const rawCode = cropId.trim();
    const upperCode = rawCode.toUpperCase();
    const digitsOnly = rawCode.replace(/\D/g, '');

    const cropCycle = await this.prisma.cropCycle.findFirst({
      where: {
        OR: [
          { cropId: upperCode },
          { cropId: `C-${upperCode}` },
          ...(digitsOnly ? [{ cropId: `C-${digitsOnly}` }, { cropId: digitsOnly }] : []),
          { id: rawCode },
        ],
        deletedAt: null,
      },
      include: {
        plot: {
          include: {
            farm: { include: { owner: { select: { id: true, name: true, kingId: true, mobile: true } } } },
          },
        },
      },
    });
    if (!cropCycle) {
      throw new NotFoundException(`No crop found with Crop ID "${cropId}".`);
    }
    return cropCycle;
  }

  async findOneOrThrow(user: AuthUser, id: string) {
    const cropCycle = await this.prisma.cropCycle.findFirst({
      where: { id, deletedAt: null },
      include: { plot: { include: { farm: true } } },
    });

    const ownerFarmerId = getEffectiveFarmerId(user);
    if (!cropCycle || (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN && cropCycle.plot.farm.ownerId !== ownerFarmerId)) {
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

    if (user.role === Role.FARMER) {
      const { plan } = await this.farmerPlansService.getEffectivePlan(user.id);
      if (plan === FarmerSubscriptionPlan.FREE && ACTIVE_STATUSES.includes(cropCycle.status)) {
        const newerActiveCrops = await this.prisma.cropCycle.count({
          where: {
            deletedAt: null,
            status: { in: ACTIVE_STATUSES },
            createdAt: { gt: cropCycle.createdAt },
            plot: { farm: { ownerId: user.id, deletedAt: null } },
          },
        });
        if (newerActiveCrops >= FREE_PLAN_MAX_ACTIVE_CROPS) {
          throw new ForbiddenException(
            'This crop is locked in View-Only mode because your Free Plan active crop limit (3 max) is filled by newer crops. Please upgrade your plan to edit older crops.'
          );
        }
      }
    }

    const { sowingDate, transplantDate, expectedHarvestDate, actualHarvestDate, ...rest } = dto;
    const isNowCompleted =
      dto.stage === CropCycleStage.COMPLETED ||
      dto.status === CropStatus.COMPLETED ||
      dto.status === CropStatus.DEACTIVE;

    const updated = await this.prisma.cropCycle.update({
      where: { id },
      data: {
        ...rest,
        status: dto.status ?? (dto.stage ? statusForStage(dto.stage) : undefined),
        ...toDateFields(dto),
      },
    });

    if (isNowCompleted) {
      await this.purgeCropVideos(id);
    }

    return updated;
  }

  /**
   * Automatically purges heavy 60-second field videos and voice audio notes upon crop completion
   * to preserve server storage, while permanently retaining verified live photos, written remarks & financial records.
   */
  async purgeCropVideos(cropId: string): Promise<number> {
    try {
      const rows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT "id", "provider", "storagePath" FROM "media_store" WHERE "cropId" = $1 AND ("mediaType" IN ('VIDEO', 'AUDIO') OR "mimeType" LIKE 'video/%' OR "mimeType" LIKE 'audio/%')`,
        cropId,
      );

      for (const row of rows) {
        if (row.provider === 'LOCAL' && row.storagePath) {
          const localFile = path.resolve(process.cwd(), 'uploads', row.storagePath);
          if (localFile.startsWith(path.resolve(process.cwd(), 'uploads')) && fs.existsSync(localFile)) {
            try {
              fs.unlinkSync(localFile);
            } catch {
              // ignore file unlink failure
            }
          }
        }
      }

      const delResult = await this.prisma.$executeRawUnsafe(
        `DELETE FROM "media_store" WHERE "cropId" = $1 AND ("mediaType" IN ('VIDEO', 'AUDIO') OR "mimeType" LIKE 'video/%' OR "mimeType" LIKE 'audio/%')`,
        cropId,
      );

      return Number(delResult);
    } catch (err: any) {
      console.warn(`[CropsService] Failed to purge field videos and audio for completed crop ${cropId}:`, err?.message);
      return 0;
    }
  }

  async remove(user: AuthUser, id: string) {
    await this.findOneOrThrow(user, id);
    return this.prisma.cropCycle.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  /** Farmer sends a crop to a certified crop doctor / advisor for review and adoption. */
  async submitToAdvisor(user: AuthUser, id: string, dto?: SubmitCropToAdvisorDto) {
    const cropCycle = await this.findOneOrThrow(user, id);

    let targetAdvisorId = dto?.advisorId;
    if (!targetAdvisorId) {
      const assignment = await this.prisma.advisorAssignment.findFirst({
        where: { farmerId: user.id, status: AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
      });
      if (assignment) {
        targetAdvisorId = assignment.advisorId;
      }
    }

    if (!targetAdvisorId) {
      throw new BadRequestException('Please select a certified Crop Doctor to adopt and supervise this crop.');
    }

    // Verify advisor exists and is active
    const advisor = await this.prisma.user.findFirst({
      where: { id: targetAdvisorId, deletedAt: null },
      select: {
        id: true,
        name: true,
        specializedCategories: true,
        specializedCrops: true,
      },
    });
    if (!advisor) {
      throw new NotFoundException('Selected Crop Doctor / Advisor was not found.');
    }

    // Agronomic specialization matching check
    if (advisor.specializedCategories && advisor.specializedCategories.length > 0 && cropCycle.category) {
      if (!advisor.specializedCategories.includes(cropCycle.category)) {
        throw new BadRequestException(
          `Doctor ${advisor.name} specializes in other crop categories and does not accept ${cropCycle.category} crops.`,
        );
      }
    }

    // Check Advisor capacity limit (Advisor Lite: 5 crops max, Advisor Plus: 10 crops max)
    const advisorPlanRec = await this.prisma.advisorTierPlan.findUnique({
      where: { advisorId: targetAdvisorId },
    });
    const advisorPlan = advisorPlanRec?.plan ?? 'LITE';
    const advisorMaxCrops = advisorPlan === 'PLUS' ? 10 : 5;

    const currentAdvisorActiveCrops = await this.prisma.cropCycle.count({
      where: {
        assignedAdvisorId: targetAdvisorId,
        deletedAt: null,
        status: { notIn: [CropStatus.COMPLETED, CropStatus.FAILED] },
        advisorReviewStatus: { in: [CropAdvisorReviewStatus.PENDING, CropAdvisorReviewStatus.ACCEPTED] },
      },
    });

    if (currentAdvisorActiveCrops >= advisorMaxCrops) {
      throw new ForbiddenException(
        `Doctor ${advisor.name} has reached their current active capacity limit of ${advisorMaxCrops} crops. Please choose another doctor or try again later.`,
      );
    }

    // Check active monthly subscription for quota linking
    const activeSub = await this.prisma.advisorSubscription.findFirst({
      where: {
        farmerId: user.id,
        status: SubscriptionPlanStatus.ACTIVE,
        endDate: { gt: new Date() },
        advisorAssignment: { advisorId: targetAdvisorId },
      },
      select: { id: true },
    });

    const updated = await this.prisma.cropCycle.update({
      where: { id },
      data: {
        assignedAdvisorId: targetAdvisorId,
        hiringModel: dto?.hiringModel ?? HiringModelType.PER_CROP,
        subscriptionId: activeSub ? activeSub.id : undefined,
        advisorReviewStatus: CropAdvisorReviewStatus.PENDING,
        submittedToAdvisorAt: new Date(),
        advisorAcceptedAt: null,
      },
    });

    await this.notificationsService.create(
      targetAdvisorId,
      NotificationType.SYSTEM,
      'New crop adoption request',
      `${user.name} sent "${updated.cropName}" for your professional supervision. Accept to add it to your roster.`,
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
      data: {
        advisorReviewStatus: CropAdvisorReviewStatus.NONE,
        assignedAdvisorId: null,
        submittedToAdvisorAt: null,
        advisorAcceptedAt: null,
      },
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

    const farmerId = cropCycle.plot.farm.ownerId;
    if (cropCycle.assignedAdvisorId && cropCycle.assignedAdvisorId !== user.id) {
      throw new ForbiddenException('This crop adoption request was submitted to another advisor.');
    }

    await this.assertAdvanceProfileComplete(farmerId);

    // Ensure AdvisorAssignment record exists for general relations (chat, VOIP call, etc.)
    const existingAssignment = await this.prisma.advisorAssignment.findFirst({
      where: { advisorId: user.id, farmerId, deletedAt: null },
    });
    if (!existingAssignment) {
      await this.prisma.advisorAssignment.create({
        data: {
          advisorId: user.id,
          farmerId,
          status: AdvisorAssignmentStatus.ACTIVE,
          startDate: new Date(),
          notes: `Auto-linked on crop adoption for "${cropCycle.cropName}"`,
        },
      });
    } else if (existingAssignment.status !== AdvisorAssignmentStatus.ACTIVE) {
      await this.prisma.advisorAssignment.update({
        where: { id: existingAssignment.id },
        data: { status: AdvisorAssignmentStatus.ACTIVE, startDate: new Date() },
      });
    }

    const updated = await this.prisma.cropCycle.update({
      where: { id },
      data: {
        assignedAdvisorId: user.id,
        advisorReviewStatus: CropAdvisorReviewStatus.ACCEPTED,
        advisorAcceptedAt: new Date(),
      },
    });

    await this.notificationsService.create(
      farmerId,
      NotificationType.SYSTEM,
      'Crop adopted by Doctor',
      `Doctor ${user.name} accepted "${cropCycle.cropName}". Your personalized advisory schedule will be published shortly.`,
      { cropCycleId: updated.id, advisorId: user.id },
    );

    return updated;
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

    const updated = await this.prisma.cropCycle.update({ where: { id }, data: { assignedSchedule } });

    await this.syncAssignedScheduleToSprayItems(cropCycle.id, cropCycle.sowingDate, assignedSchedule, user.id);

    await this.notificationsService.create(
      cropCycle.plot.farm.ownerId,
      NotificationType.SPRAY_REMINDER,
      'Advisory schedule updated',
      `Your advisor published an updated crop schedule for ${cropCycle.cropName}.`,
      { cropCycleId: cropCycle.id },
    );

    return updated;
  }

  private async syncAssignedScheduleToSprayItems(
    cropCycleId: string,
    sowingDate: Date | null,
    assignedScheduleStr: string,
    advisorId: string,
  ) {
    if (!assignedScheduleStr) return;

    const baseDate = sowingDate ? new Date(sowingDate) : new Date();
    const lines = assignedScheduleStr
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.toLowerCase().includes('schedule') && !l.toLowerCase().includes('plan'));

    await this.prisma.spraySchedule.deleteMany({
      where: { cropCycleId },
    });

    for (let idx = 0; idx < lines.length; idx += 1) {
      const line = lines[idx];
      let scheduledDate = new Date(baseDate);

      const dayMatch = line.match(/(?:\[?Day\s*(\d+).*?\]?:\s*)(.*)/i);
      let taskName = line;
      if (dayMatch) {
        const dayNum = parseInt(dayMatch[1], 10) || (idx + 1);
        scheduledDate.setDate(baseDate.getDate() + (dayNum - 1));
        taskName = dayMatch[2].trim();
      } else {
        scheduledDate.setDate(baseDate.getDate() + idx * 5);
      }

      if (taskName) {
        await this.prisma.spraySchedule.create({
          data: {
            cropCycleId,
            recommendedProduct: taskName,
            scheduledDate,
            createdByAdvisorId: advisorId,
          },
        }).catch(() => undefined);

        await this.prisma.cropActivitySchedule.create({
          data: {
            cropCycleId,
            title: taskName,
            activityType: 'SPRAY',
            scheduledDate,
            createdByAdvisorId: advisorId,
          },
        }).catch(() => undefined);
      }
    }
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

    const farmerId = cropCycle.plot.farm.ownerId;
    if (cropCycle.assignedAdvisorId && cropCycle.assignedAdvisorId !== user.id) {
      throw new ForbiddenException('This crop adoption request was submitted to another advisor.');
    }

    const updated = await this.prisma.cropCycle.update({
      where: { id },
      data: {
        advisorReviewStatus: CropAdvisorReviewStatus.NONE,
        assignedAdvisorId: null,
        submittedToAdvisorAt: null,
        advisorAcceptedAt: null,
      },
    });

    await this.notificationsService.create(
      farmerId,
      NotificationType.SYSTEM,
      'Crop submission declined',
      `Doctor ${user.name} was unable to accept "${cropCycle.cropName}" for review${reason ? `: ${reason}.` : '.'} Please review and select another specialist.`,
      { cropCycleId: id, advisorId: user.id },
    );

    return updated;
  }

  /** Advisor's list of crops pending their review, across all currently-assigned farmers and direct crop adoptions. */
  async listPendingForAdvisor(user: AuthUser) {
    const assignments = await this.prisma.advisorAssignment.findMany({
      where: { advisorId: user.id, status: AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
      select: { farmerId: true },
    });
    const farmerIds = assignments.map((a) => a.farmerId);

    return this.prisma.cropCycle.findMany({
      where: {
        deletedAt: null,
        advisorReviewStatus: CropAdvisorReviewStatus.PENDING,
        OR: [
          { assignedAdvisorId: user.id },
          ...(farmerIds.length > 0 ? [{ plot: { farm: { ownerId: { in: farmerIds } } }, assignedAdvisorId: null }] : []),
        ],
      },
      include: {
        plot: {
          select: {
            id: true,
            name: true,
            area: true,
            areaUnit: true,
            soilType: true,
            irrigationType: true,
            waterSource: true,
            farm: {
              select: {
                id: true,
                name: true,
                totalArea: true,
                areaUnit: true,
                soilType: true,
                irrigationSource: true,
                ownerId: true,
                owner: { select: { id: true, name: true, mobile: true, village: true, district: true, state: true, sprayTankSizeL: true, soilType: true, waterType: true } },
              },
            },
          },
        },
      },
      orderBy: { submittedToAdvisorAt: 'desc' },
    });
  }

  /** Advisor's list of crops they've already accepted, across all currently-assigned farmers and direct crop adoptions. */
  async listAcceptedForAdvisor(user: AuthUser) {
    const assignments = await this.prisma.advisorAssignment.findMany({
      where: { advisorId: user.id, status: AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
      select: { farmerId: true },
    });
    const farmerIds = assignments.map((a) => a.farmerId);

    return this.prisma.cropCycle.findMany({
      where: {
        deletedAt: null,
        advisorReviewStatus: CropAdvisorReviewStatus.ACCEPTED,
        OR: [
          { assignedAdvisorId: user.id },
          ...(farmerIds.length > 0 ? [{ plot: { farm: { ownerId: { in: farmerIds } } }, assignedAdvisorId: null }] : []),
        ],
      },
      include: {
        plot: {
          select: {
            id: true,
            name: true,
            area: true,
            areaUnit: true,
            soilType: true,
            irrigationType: true,
            waterSource: true,
            farm: {
              select: {
                id: true,
                name: true,
                totalArea: true,
                areaUnit: true,
                soilType: true,
                irrigationSource: true,
                ownerId: true,
                owner: { select: { id: true, name: true, mobile: true, village: true, district: true, state: true, sprayTankSizeL: true, soilType: true, waterType: true } },
              },
            },
          },
        },
      },
      orderBy: { advisorAcceptedAt: 'desc' },
    });
  }
}
