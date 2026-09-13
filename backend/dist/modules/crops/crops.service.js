"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CropsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const plots_service_1 = require("../plots/plots.service");
const farmer_plans_service_1 = require("../farmer-plans/farmer-plans.service");
const advisor_assignment_service_1 = require("../advisor-assignment/advisor-assignment.service");
const notifications_service_1 = require("../notifications/notifications.service");
const crop_id_util_1 = require("../../common/utils/crop-id.util");
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
            result[field] = new Date(value);
        }
    }
    return result;
}
let CropsService = class CropsService {
    prisma;
    plotsService;
    farmerPlansService;
    advisorAssignmentService;
    notificationsService;
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
            const maxTotalCrops = planPricing?.maxTotalCrops ?? (plan === client_1.FarmerSubscriptionPlan.FREE ? farmer_plans_service_1.FREE_PLAN_MAX_CROPS : null);
            const maxActiveCrops = planPricing?.maxActiveCrops ?? (plan === client_1.FarmerSubscriptionPlan.FREE ? farmer_plans_service_1.FREE_PLAN_MAX_ACTIVE_CROPS : null);
            if (maxTotalCrops != null && maxTotalCrops > 0) {
                const totalCrops = await this.prisma.cropCycle.count({
                    where: {
                        deletedAt: null,
                        plot: { farm: { ownerId: user.id, deletedAt: null } },
                    },
                });
                if (totalCrops >= maxTotalCrops) {
                    const planName = plan === client_1.FarmerSubscriptionPlan.PRO ? 'Lite Plan' : plan === client_1.FarmerSubscriptionPlan.SMART ? 'Pro Plan' : plan === client_1.FarmerSubscriptionPlan.SUPER ? 'Smart Plan' : 'Free Plan';
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
                    const planName = plan === client_1.FarmerSubscriptionPlan.PRO ? 'Lite Plan' : plan === client_1.FarmerSubscriptionPlan.SMART ? 'Pro Plan' : plan === client_1.FarmerSubscriptionPlan.SUPER ? 'Smart Plan' : 'Free Plan';
                    throw new common_1.ForbiddenException(`Your current plan (${planName}) allows a maximum of ${maxActiveCrops} active crop(s) at a time. Please upgrade your plan to add more active crops.`);
                }
            }
        }
        const { plotId, sowingDate, transplantDate, expectedHarvestDate, actualHarvestDate, ...rest } = dto;
        const cropId = await (0, crop_id_util_1.generateUniqueCropId)(this.prisma);
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
    listMineForFarmer(user) {
        return this.prisma.cropCycle.findMany({
            where: {
                deletedAt: null,
                plot: { farm: { ownerId: user.id, deletedAt: null } },
            },
            include: { plot: { select: { id: true, name: true, farmId: true, area: true, areaUnit: true, irrigationType: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    findAllForPlot(user, plotId) {
        return this.plotsService.findOneOrThrow(user, plotId).then(() => this.prisma.cropCycle.findMany({
            where: { plotId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
        }));
    }
    async lookupByCropId(cropId) {
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
            throw new common_1.NotFoundException('No crop found with this Crop ID.');
        }
        return cropCycle;
    }
    async findOneOrThrow(user, id) {
        const cropCycle = await this.prisma.cropCycle.findFirst({
            where: { id, deletedAt: null },
            include: { plot: { include: { farm: true } } },
        });
        if (!cropCycle || (user.role !== client_1.Role.ADMIN && user.role !== client_1.Role.SUPER_ADMIN && cropCycle.plot.farm.ownerId !== user.id)) {
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
    async remove(user, id) {
        await this.findOneOrThrow(user, id);
        return this.prisma.cropCycle.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    async submitToAdvisor(user, id) {
        await this.findOneOrThrow(user, id);
        const assignment = await this.prisma.advisorAssignment.findFirst({
            where: { farmerId: user.id, status: client_1.AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
        });
        if (!assignment) {
            throw new common_1.BadRequestException('You need an assigned advisor before submitting a crop for review.');
        }
        const advisorPlanRec = await this.prisma.advisorTierPlan.findUnique({
            where: { advisorId: assignment.advisorId },
        });
        const advisorPlan = advisorPlanRec?.plan ?? 'LITE';
        const advisorMaxCrops = advisorPlan === 'PLUS' ? 10 : 5;
        const currentAdvisorActiveCrops = await this.prisma.cropCycle.count({
            where: {
                deletedAt: null,
                status: { notIn: [client_1.CropStatus.COMPLETED, client_1.CropStatus.FAILED] },
                advisorReviewStatus: { in: [client_1.CropAdvisorReviewStatus.PENDING, client_1.CropAdvisorReviewStatus.ACCEPTED] },
            },
        });
        if (currentAdvisorActiveCrops >= advisorMaxCrops) {
            throw new common_1.ForbiddenException(`ਇਸ ਐਡਵਾਈਜ਼ਰ ਦੇ ਪਲਾਨ (${advisorPlan === 'PLUS' ? 'Advisor Plus' : 'Advisor Lite'}) ਅਨੁਸਾਰ ਇੱਕ ਸਮੇਂ ਸਿਰਫ਼ ${advisorMaxCrops} ਫਸਲਾਂ ਹੀ ਰਿਵਿਊ ਅਧੀਨ ਰੱਖੀਆਂ ਜਾ ਸਕਦੀਆਂ ਹਨ।`);
        }
        const updated = await this.prisma.cropCycle.update({
            where: { id },
            data: {
                advisorReviewStatus: client_1.CropAdvisorReviewStatus.PENDING,
                submittedToAdvisorAt: new Date(),
                advisorAcceptedAt: null,
            },
        });
        await this.notificationsService.create(assignment.advisorId, client_1.NotificationType.SYSTEM, 'New crop submitted for review', `${user.name} sent "${updated.cropName}" for your review. Accept it to add it to your roster.`, { cropCycleId: updated.id, farmerId: user.id });
        return updated;
    }
    async cancelSubmission(user, id) {
        const cropCycle = await this.findOneOrThrow(user, id);
        if (cropCycle.advisorReviewStatus !== client_1.CropAdvisorReviewStatus.PENDING) {
            throw new common_1.BadRequestException('Only a request still awaiting your advisor\'s response can be cancelled.');
        }
        return this.prisma.cropCycle.update({
            where: { id },
            data: { advisorReviewStatus: client_1.CropAdvisorReviewStatus.NONE, submittedToAdvisorAt: null, advisorAcceptedAt: null },
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
        await this.assertAdvanceProfileComplete(cropCycle.plot.farm.ownerId);
        await this.advisorAssignmentService.assertAdvisorAssignedToFarmer(user.id, cropCycle.plot.farm.ownerId);
        return this.prisma.cropCycle.update({
            where: { id },
            data: { advisorReviewStatus: client_1.CropAdvisorReviewStatus.ACCEPTED, advisorAcceptedAt: new Date() },
        });
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
        await this.advisorAssignmentService.assertAdvisorAssignedToFarmer(user.id, cropCycle.plot.farm.ownerId);
        const updated = await this.prisma.cropCycle.update({
            where: { id },
            data: { advisorReviewStatus: client_1.CropAdvisorReviewStatus.NONE, submittedToAdvisorAt: null, advisorAcceptedAt: null },
        });
        await this.notificationsService.create(cropCycle.plot.farm.ownerId, client_1.NotificationType.SYSTEM, 'Crop submission rejected', `Your advisor did not accept "${cropCycle.cropName}" for review${reason ? `: ${reason}.` : '.'} Please review and resubmit.`, { cropCycleId: id, advisorId: user.id });
        return updated;
    }
    async listPendingForAdvisor(user) {
        const assignments = await this.prisma.advisorAssignment.findMany({
            where: { advisorId: user.id, status: client_1.AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
            select: { farmerId: true },
        });
        const farmerIds = assignments.map((a) => a.farmerId);
        if (farmerIds.length === 0)
            return [];
        return this.prisma.cropCycle.findMany({
            where: {
                deletedAt: null,
                advisorReviewStatus: client_1.CropAdvisorReviewStatus.PENDING,
                plot: { farm: { ownerId: { in: farmerIds } } },
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
        if (farmerIds.length === 0)
            return [];
        return this.prisma.cropCycle.findMany({
            where: {
                deletedAt: null,
                advisorReviewStatus: client_1.CropAdvisorReviewStatus.ACCEPTED,
                plot: { farm: { ownerId: { in: farmerIds } } },
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