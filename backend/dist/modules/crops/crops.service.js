"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CropsService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const plots_service_1 = require("../plots/plots.service");
const farmer_plans_service_1 = require("../farmer-plans/farmer-plans.service");
const advisor_assignment_service_1 = require("../advisor-assignment/advisor-assignment.service");
const notifications_service_1 = require("../notifications/notifications.service");
const crop_id_util_1 = require("../../common/utils/crop-id.util");
const effective_farmer_util_1 = require("../../common/utils/effective-farmer.util");
const DATE_FIELDS = ['sowingDate', 'transplantDate', 'expectedHarvestDate', 'actualHarvestDate'];
const ACTIVE_STATUSES = [
    client_1.CropStatus.PLANNED,
    client_1.CropStatus.ACTIVE,
    client_1.CropStatus.HARVESTING,
];
function statusForStage(stage) {
    if (stage === client_1.CropCycleStage.COMPLETED)
        return client_1.CropStatus.DEACTIVE;
    if (stage === client_1.CropCycleStage.HARVESTING)
        return client_1.CropStatus.HARVESTING;
    return client_1.CropStatus.ACTIVE;
}
function toDateFields(dto) {
    const result = {};
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
let CropsService = class CropsService {
    constructor(prisma, plotsService, farmerPlansService, advisorAssignmentService, notificationsService) {
        this.prisma = prisma;
        this.plotsService = plotsService;
        this.farmerPlansService = farmerPlansService;
        this.advisorAssignmentService = advisorAssignmentService;
        this.notificationsService = notificationsService;
    }
    async assertAdvanceProfileComplete(farmerId) {
        const farmer = await this.prisma.user.findUnique({
            where: { id: farmerId },
            select: { photoUrl: true, sprayTankSizeL: true, soilType: true, waterType: true },
        });
        const isComplete = !!(farmer?.photoUrl && farmer?.sprayTankSizeL && farmer?.soilType && farmer?.waterType);
        if (!isComplete) {
            throw new common_1.ForbiddenException('Complete your Advance Profile (photo, spray tank size, soil & water type) before adding a crop.');
        }
    }
    async create(user, dto) {
        await this.plotsService.findOneOrThrow(user, dto.plotId);
        if (user.role === client_1.Role.FARMER) {
            const { plan } = await this.farmerPlansService.getEffectivePlan(user.id);
            const planPricing = await this.prisma.farmerPlanPricing.findFirst({
                where: { plan },
            });
            const appSettings = await this.prisma.appSetting.findFirst();
            const dynamicFreeMax = appSettings?.freePlanMaxCrops ?? farmer_plans_service_1.FREE_PLAN_MAX_ACTIVE_CROPS;
            const maxTotalCrops = planPricing?.maxTotalCrops ?? (plan === client_1.FarmerSubscriptionPlan.FREE ? (appSettings?.freePlanMaxCrops ?? farmer_plans_service_1.FREE_PLAN_MAX_CROPS) : null);
            const maxActiveCrops = planPricing?.maxActiveCrops ?? (plan === client_1.FarmerSubscriptionPlan.FREE ? dynamicFreeMax : null);
            if (maxTotalCrops != null && maxTotalCrops > 0) {
                const totalCrops = await this.prisma.cropCycle.count({
                    where: {
                        deletedAt: null,
                        plot: { farm: { ownerId: user.id, deletedAt: null } },
                    },
                });
                if (totalCrops >= maxTotalCrops) {
                    const planName = plan === client_1.FarmerSubscriptionPlan.PRO ? 'Kisan Plan' : plan === client_1.FarmerSubscriptionPlan.SMART ? 'Boss Plan' : (plan === client_1.FarmerSubscriptionPlan.SUPER || plan === client_1.FarmerSubscriptionPlan.VIP) ? 'Farmer VIP Plan' : 'Free Plan';
                    throw new common_1.ForbiddenException(`Your current plan (${planName}) allows adding a maximum of ${maxTotalCrops} crop(s). Please upgrade your plan to add more crops.`);
                }
            }
            if (maxActiveCrops != null && maxActiveCrops > 0) {
                const activeCrops = await this.prisma.cropCycle.count({
                    where: {
                        deletedAt: null,
                        status: { in: ACTIVE_STATUSES },
                        plot: { farm: { ownerId: user.id, deletedAt: null } },
                    },
                });
                if (activeCrops >= maxActiveCrops) {
                    const planName = plan === client_1.FarmerSubscriptionPlan.PRO ? 'Kisan Plan' : plan === client_1.FarmerSubscriptionPlan.SMART ? 'Boss Plan' : (plan === client_1.FarmerSubscriptionPlan.SUPER || plan === client_1.FarmerSubscriptionPlan.VIP) ? 'Farmer VIP Plan' : 'Free Plan';
                    throw new common_1.ForbiddenException(`Your current plan (${planName}) allows a maximum of ${maxActiveCrops} active crop(s) at a time. Please upgrade your plan to add more active crops.`);
                }
            }
        }
        try {
            const { plotId, sowingDate, transplantDate, expectedHarvestDate, actualHarvestDate, ...rest } = dto;
            const cropId = await (0, crop_id_util_1.generateUniqueCropId)(this.prisma);
            return await this.prisma.cropCycle.create({
                data: {
                    ...rest,
                    cropId,
                    plotId,
                    status: dto.status ?? (dto.stage ? statusForStage(dto.stage) : undefined),
                    ...toDateFields(dto),
                },
            });
        }
        catch (err) {
            console.error('[CropsService.create] Database error:', err);
            throw new common_1.BadRequestException(`Failed to create crop cycle: ${err?.message || 'Database error'}`);
        }
    }
    async listMineForFarmer(user) {
        if (!user?.id)
            return [];
        try {
            const isGlobalAdmin = user.role === client_1.Role.ADMIN ||
                user.role === client_1.Role.SUPER_ADMIN ||
                (Array.isArray(user.roles) && (user.roles.includes(client_1.Role.ADMIN) || user.roles.includes(client_1.Role.SUPER_ADMIN)));
            const ownerFarmerId = (0, effective_farmer_util_1.getEffectiveFarmerId)(user);
            const userFarms = await this.prisma.farm.findMany({
                where: isGlobalAdmin ? { deletedAt: null } : { ownerId: ownerFarmerId, deletedAt: null },
                select: { id: true, plots: { where: { deletedAt: null }, select: { id: true } } },
            });
            const plotIds = userFarms.flatMap((f) => f.plots.map((p) => p.id));
            if (plotIds.length === 0)
                return [];
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
            if (user.role === client_1.Role.FARMER) {
                const { plan } = await this.farmerPlansService.getEffectivePlan(user.id);
                if (plan === client_1.FarmerSubscriptionPlan.FREE) {
                    let activeCount = 0;
                    return crops.map((c) => {
                        const isActiveStatus = ACTIVE_STATUSES.includes(c.status);
                        if (isActiveStatus) {
                            activeCount++;
                            if (activeCount > farmer_plans_service_1.FREE_PLAN_MAX_ACTIVE_CROPS) {
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
        }
        catch (err) {
            console.error('[CropsService.listMineForFarmer] Safe fallback catch:', err);
            return [];
        }
    }
    findAllForPlot(user, plotId) {
        return this.plotsService.findOneOrThrow(user, plotId).then(() => this.prisma.cropCycle.findMany({
            where: { plotId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
        }));
    }
    async lookupByCropId(cropId) {
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
            throw new common_1.NotFoundException(`No crop found with Crop ID "${cropId}".`);
        }
        return cropCycle;
    }
    async findOneOrThrow(user, id) {
        const cropCycle = await this.prisma.cropCycle.findFirst({
            where: { id, deletedAt: null },
            include: { plot: { include: { farm: true } } },
        });
        const ownerFarmerId = (0, effective_farmer_util_1.getEffectiveFarmerId)(user);
        if (!cropCycle || (user.role !== client_1.Role.ADMIN && user.role !== client_1.Role.SUPER_ADMIN && cropCycle.plot.farm.ownerId !== ownerFarmerId)) {
            throw new common_1.NotFoundException('Crop cycle not found.');
        }
        if (user.role === client_1.Role.FARMER &&
            cropCycle.status === client_1.CropStatus.COMPLETED) {
            const { plan } = await this.farmerPlansService.getEffectivePlan(user.id);
            if (plan === client_1.FarmerSubscriptionPlan.FREE) {
                return {
                    ...cropCycle,
                    planGated: true,
                    planGatedMessage: 'Completed crop ki poori jaankari ke liye BASIC ya PREMIUM plan len. Coupon code se activate karein.',
                };
            }
        }
        return cropCycle;
    }
    async update(user, id, dto) {
        const cropCycle = await this.findOneOrThrow(user, id);
        if (cropCycle.status === client_1.CropStatus.COMPLETED) {
            throw new common_1.ForbiddenException('This crop is completed and locked — no further changes allowed.');
        }
        if (user.role === client_1.Role.FARMER) {
            const { plan } = await this.farmerPlansService.getEffectivePlan(user.id);
            if (plan === client_1.FarmerSubscriptionPlan.FREE && ACTIVE_STATUSES.includes(cropCycle.status)) {
                const newerActiveCrops = await this.prisma.cropCycle.count({
                    where: {
                        deletedAt: null,
                        status: { in: ACTIVE_STATUSES },
                        createdAt: { gt: cropCycle.createdAt },
                        plot: { farm: { ownerId: user.id, deletedAt: null } },
                    },
                });
                if (newerActiveCrops >= farmer_plans_service_1.FREE_PLAN_MAX_ACTIVE_CROPS) {
                    throw new common_1.ForbiddenException('This crop is locked in View-Only mode because your Free Plan active crop limit (3 max) is filled by newer crops. Please upgrade your plan to edit older crops.');
                }
            }
        }
        const { sowingDate, transplantDate, expectedHarvestDate, actualHarvestDate, ...rest } = dto;
        const isNowCompleted = dto.stage === client_1.CropCycleStage.COMPLETED ||
            dto.status === client_1.CropStatus.COMPLETED ||
            dto.status === client_1.CropStatus.DEACTIVE;
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
    async purgeCropVideos(cropId) {
        try {
            const rows = await this.prisma.$queryRawUnsafe(`SELECT "id", "provider", "storagePath" FROM "media_store" WHERE "cropId" = $1 AND ("mediaType" IN ('VIDEO', 'AUDIO') OR "mimeType" LIKE 'video/%' OR "mimeType" LIKE 'audio/%')`, cropId);
            for (const row of rows) {
                if (row.provider === 'LOCAL' && row.storagePath) {
                    const localFile = path.resolve(process.cwd(), 'uploads', row.storagePath);
                    if (localFile.startsWith(path.resolve(process.cwd(), 'uploads')) && fs.existsSync(localFile)) {
                        try {
                            fs.unlinkSync(localFile);
                        }
                        catch {
                        }
                    }
                }
            }
            const delResult = await this.prisma.$executeRawUnsafe(`DELETE FROM "media_store" WHERE "cropId" = $1 AND ("mediaType" IN ('VIDEO', 'AUDIO') OR "mimeType" LIKE 'video/%' OR "mimeType" LIKE 'audio/%')`, cropId);
            return Number(delResult);
        }
        catch (err) {
            console.warn(`[CropsService] Failed to purge field videos and audio for completed crop ${cropId}:`, err?.message);
            return 0;
        }
    }
    async remove(user, id) {
        await this.findOneOrThrow(user, id);
        return this.prisma.cropCycle.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    async submitToAdvisor(user, id, dto) {
        const cropCycle = await this.findOneOrThrow(user, id);
        let targetAdvisorId = dto?.advisorId;
        if (!targetAdvisorId) {
            const assignment = await this.prisma.advisorAssignment.findFirst({
                where: { farmerId: user.id, status: client_1.AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
            });
            if (assignment) {
                targetAdvisorId = assignment.advisorId;
            }
        }
        if (!targetAdvisorId) {
            throw new common_1.BadRequestException('Please select a certified Crop Doctor to adopt and supervise this crop.');
        }
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
            throw new common_1.NotFoundException('Selected Crop Doctor / Advisor was not found.');
        }
        if (advisor.specializedCategories && advisor.specializedCategories.length > 0 && cropCycle.category) {
            if (!advisor.specializedCategories.includes(cropCycle.category)) {
                throw new common_1.BadRequestException(`Doctor ${advisor.name} specializes in other crop categories and does not accept ${cropCycle.category} crops.`);
            }
        }
        const advisorPlanRec = await this.prisma.advisorTierPlan.findUnique({
            where: { advisorId: targetAdvisorId },
        });
        const advisorPlan = advisorPlanRec?.plan ?? 'LITE';
        const advisorMaxCrops = advisorPlan === 'PLUS' ? 10 : 5;
        const currentAdvisorActiveCrops = await this.prisma.cropCycle.count({
            where: {
                assignedAdvisorId: targetAdvisorId,
                deletedAt: null,
                status: { notIn: [client_1.CropStatus.COMPLETED, client_1.CropStatus.FAILED] },
                advisorReviewStatus: { in: [client_1.CropAdvisorReviewStatus.PENDING, client_1.CropAdvisorReviewStatus.ACCEPTED] },
            },
        });
        if (currentAdvisorActiveCrops >= advisorMaxCrops) {
            throw new common_1.ForbiddenException(`Doctor ${advisor.name} has reached their current active capacity limit of ${advisorMaxCrops} crops. Please choose another doctor or try again later.`);
        }
        const activeSub = await this.prisma.advisorSubscription.findFirst({
            where: {
                farmerId: user.id,
                status: client_1.SubscriptionPlanStatus.ACTIVE,
                endDate: { gt: new Date() },
                advisorAssignment: { advisorId: targetAdvisorId },
            },
            select: { id: true },
        });
        const updated = await this.prisma.cropCycle.update({
            where: { id },
            data: {
                assignedAdvisorId: targetAdvisorId,
                hiringModel: dto?.hiringModel ?? client_1.HiringModelType.PER_CROP,
                subscriptionId: activeSub ? activeSub.id : undefined,
                advisorReviewStatus: client_1.CropAdvisorReviewStatus.PENDING,
                submittedToAdvisorAt: new Date(),
                advisorAcceptedAt: null,
            },
        });
        await this.notificationsService.create(targetAdvisorId, client_1.NotificationType.SYSTEM, 'New crop adoption request', `${user.name} sent "${updated.cropName}" for your professional supervision. Accept to add it to your roster.`, { cropCycleId: updated.id, farmerId: user.id });
        return updated;
    }
    async cancelSubmission(user, id) {
        const cropCycle = await this.findOneOrThrow(user, id);
        if (cropCycle.advisorReviewStatus !== client_1.CropAdvisorReviewStatus.PENDING) {
            throw new common_1.BadRequestException('Only a request still awaiting your advisor\'s response can be cancelled.');
        }
        return this.prisma.cropCycle.update({
            where: { id },
            data: {
                advisorReviewStatus: client_1.CropAdvisorReviewStatus.NONE,
                assignedAdvisorId: null,
                submittedToAdvisorAt: null,
                advisorAcceptedAt: null,
            },
        });
    }
    async acceptByAdvisor(user, id) {
        const cropCycle = await this.prisma.cropCycle.findFirst({
            where: { id, deletedAt: null },
            include: { plot: { include: { farm: true } } },
        });
        if (!cropCycle) {
            throw new common_1.NotFoundException('Crop cycle not found.');
        }
        if (cropCycle.advisorReviewStatus !== client_1.CropAdvisorReviewStatus.PENDING) {
            throw new common_1.BadRequestException('This crop has not been submitted for review.');
        }
        const farmerId = cropCycle.plot.farm.ownerId;
        if (cropCycle.assignedAdvisorId && cropCycle.assignedAdvisorId !== user.id) {
            throw new common_1.ForbiddenException('This crop adoption request was submitted to another advisor.');
        }
        await this.assertAdvanceProfileComplete(farmerId);
        const existingAssignment = await this.prisma.advisorAssignment.findFirst({
            where: { advisorId: user.id, farmerId, deletedAt: null },
        });
        if (!existingAssignment) {
            await this.prisma.advisorAssignment.create({
                data: {
                    advisorId: user.id,
                    farmerId,
                    status: client_1.AdvisorAssignmentStatus.ACTIVE,
                    startDate: new Date(),
                    notes: `Auto-linked on crop adoption for "${cropCycle.cropName}"`,
                },
            });
        }
        else if (existingAssignment.status !== client_1.AdvisorAssignmentStatus.ACTIVE) {
            await this.prisma.advisorAssignment.update({
                where: { id: existingAssignment.id },
                data: { status: client_1.AdvisorAssignmentStatus.ACTIVE, startDate: new Date() },
            });
        }
        const updated = await this.prisma.cropCycle.update({
            where: { id },
            data: {
                assignedAdvisorId: user.id,
                advisorReviewStatus: client_1.CropAdvisorReviewStatus.ACCEPTED,
                advisorAcceptedAt: new Date(),
            },
        });
        await this.notificationsService.create(farmerId, client_1.NotificationType.SYSTEM, 'Crop adopted by Doctor', `Doctor ${user.name} accepted "${cropCycle.cropName}". Your personalized advisory schedule will be published shortly.`, { cropCycleId: updated.id, advisorId: user.id });
        return updated;
    }
    async updateAssignedSchedule(user, id, assignedSchedule) {
        const cropCycle = await this.prisma.cropCycle.findFirst({
            where: { id, deletedAt: null },
            include: { plot: { include: { farm: true } } },
        });
        if (!cropCycle) {
            throw new common_1.NotFoundException('Crop cycle not found.');
        }
        if (cropCycle.advisorReviewStatus !== client_1.CropAdvisorReviewStatus.ACCEPTED) {
            throw new common_1.BadRequestException('You can only schedule crops that are under active advisor review.');
        }
        if (user.role === client_1.Role.ADVISOR) {
            await this.advisorAssignmentService.assertAdvisorAssignedToFarmer(user.id, cropCycle.plot.farm.ownerId);
        }
        else if (cropCycle.plot.farm.ownerId !== user.id && user.role !== client_1.Role.ADMIN && user.role !== client_1.Role.SUPER_ADMIN) {
            throw new common_1.NotFoundException('Crop cycle not found.');
        }
        const updated = await this.prisma.cropCycle.update({ where: { id }, data: { assignedSchedule } });
        await this.syncAssignedScheduleToSprayItems(cropCycle.id, cropCycle.sowingDate, assignedSchedule, user.id);
        await this.notificationsService.create(cropCycle.plot.farm.ownerId, client_1.NotificationType.SPRAY_REMINDER, 'Advisory schedule updated', `Your advisor published an updated crop schedule for ${cropCycle.cropName}.`, { cropCycleId: cropCycle.id });
        return updated;
    }
    async syncAssignedScheduleToSprayItems(cropCycleId, sowingDate, assignedScheduleStr, advisorId) {
        if (!assignedScheduleStr)
            return;
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
            }
            else {
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
    async rejectByAdvisor(user, id, reason) {
        const cropCycle = await this.prisma.cropCycle.findFirst({
            where: { id, deletedAt: null },
            include: { plot: { include: { farm: true } } },
        });
        if (!cropCycle) {
            throw new common_1.NotFoundException('Crop cycle not found.');
        }
        if (cropCycle.advisorReviewStatus !== client_1.CropAdvisorReviewStatus.PENDING) {
            throw new common_1.BadRequestException('This crop has not been submitted for review.');
        }
        const farmerId = cropCycle.plot.farm.ownerId;
        if (cropCycle.assignedAdvisorId && cropCycle.assignedAdvisorId !== user.id) {
            throw new common_1.ForbiddenException('This crop adoption request was submitted to another advisor.');
        }
        const updated = await this.prisma.cropCycle.update({
            where: { id },
            data: {
                advisorReviewStatus: client_1.CropAdvisorReviewStatus.NONE,
                assignedAdvisorId: null,
                submittedToAdvisorAt: null,
                advisorAcceptedAt: null,
            },
        });
        await this.notificationsService.create(farmerId, client_1.NotificationType.SYSTEM, 'Crop submission declined', `Doctor ${user.name} was unable to accept "${cropCycle.cropName}" for review${reason ? `: ${reason}.` : '.'} Please review and select another specialist.`, { cropCycleId: id, advisorId: user.id });
        return updated;
    }
    async listPendingForAdvisor(user) {
        const assignments = await this.prisma.advisorAssignment.findMany({
            where: { advisorId: user.id, status: client_1.AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
            select: { farmerId: true },
        });
        const farmerIds = assignments.map((a) => a.farmerId);
        return this.prisma.cropCycle.findMany({
            where: {
                deletedAt: null,
                advisorReviewStatus: client_1.CropAdvisorReviewStatus.PENDING,
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
    async listAcceptedForAdvisor(user) {
        const assignments = await this.prisma.advisorAssignment.findMany({
            where: { advisorId: user.id, status: client_1.AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
            select: { farmerId: true },
        });
        const farmerIds = assignments.map((a) => a.farmerId);
        return this.prisma.cropCycle.findMany({
            where: {
                deletedAt: null,
                advisorReviewStatus: client_1.CropAdvisorReviewStatus.ACCEPTED,
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
};
exports.CropsService = CropsService;
exports.CropsService = CropsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        plots_service_1.PlotsService,
        farmer_plans_service_1.FarmerPlansService,
        advisor_assignment_service_1.AdvisorAssignmentService,
        notifications_service_1.NotificationsService])
], CropsService);
//# sourceMappingURL=crops.service.js.map