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
exports.GardensService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const gardener_plans_service_1 = require("../gardener-plans/gardener-plans.service");
const ai_chat_service_1 = require("../ai-chat/ai-chat.service");
const auth_user_util_1 = require("../../common/utils/auth-user.util");
const FREE_GARDENER_MONTHLY_AI_SCANS = 5;
const PREMIUM_GARDENER_MONTHLY_AI_SCANS = 100;
let GardensService = class GardensService {
    constructor(prisma, gardenerPlansService, aiChatService) {
        this.prisma = prisma;
        this.gardenerPlansService = gardenerPlansService;
        this.aiChatService = aiChatService;
    }
    create(user, dto) {
        return this.prisma.garden.create({
            data: {
                name: dto.name,
                gardenType: dto.gardenType || client_1.GardenType.BALCONY,
                location: dto.location,
                area: dto.area,
                sunlightExposure: dto.sunlightExposure,
                wateringSource: dto.wateringSource,
                gardenerId: user.id,
            },
        });
    }
    findAll(user) {
        const isAdmin = (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.ADMIN) || (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.SUPER_ADMIN);
        return this.prisma.garden.findMany({
            where: { ...(isAdmin ? {} : { gardenerId: user.id }) },
            include: {
                plants: { where: { deletedAt: null } },
                schedules: { orderBy: { nextDueDate: 'asc' } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOneOrThrow(user, id) {
        const garden = await this.prisma.garden.findFirst({
            where: { id },
            include: {
                plants: { where: { deletedAt: null } },
                schedules: { orderBy: { nextDueDate: 'asc' } },
            },
        });
        const isAdmin = (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.ADMIN) || (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.SUPER_ADMIN);
        if (!garden || (!isAdmin && garden.gardenerId !== user.id)) {
            throw new common_1.NotFoundException('Garden not found.');
        }
        return garden;
    }
    async addPlant(user, gardenIdOrNull, dto) {
        const effectiveGardenId = gardenIdOrNull || dto.gardenId || null;
        let garden = null;
        if (effectiveGardenId) {
            garden = await this.findOneOrThrow(user, effectiveGardenId);
        }
        if ((0, auth_user_util_1.hasActiveRole)(user, client_1.Role.GARDENER) && !(0, auth_user_util_1.hasActiveRole)(user, client_1.Role.ADMIN) && !(0, auth_user_util_1.hasActiveRole)(user, client_1.Role.SUPER_ADMIN)) {
            const { plan } = await this.gardenerPlansService.getEffectivePlan(user.id);
            if (plan === client_1.GardenerSubscriptionPlan.FREE) {
                const totalPlants = await this.prisma.plant.count({
                    where: {
                        deletedAt: null,
                        OR: [
                            { gardenerId: user.id },
                            { garden: { gardenerId: user.id } },
                        ],
                    },
                });
                if (totalPlants >= gardener_plans_service_1.FREE_PLAN_MAX_PLANTS) {
                    throw new common_1.ForbiddenException(`Free plan allows up to ${gardener_plans_service_1.FREE_PLAN_MAX_PLANTS} plants. Upgrade to the Premium plan to add more plants.`);
                }
            }
        }
        const { plantedDate, ...rest } = dto;
        return this.prisma.plant.create({
            data: {
                ...rest,
                gardenId: garden ? garden.id : null,
                gardenerId: user.id,
                plantedDate: plantedDate ? new Date(plantedDate) : undefined,
            },
        });
    }
    listPlants(user, gardenId) {
        return this.findOneOrThrow(user, gardenId).then(() => this.prisma.plant.findMany({
            where: { gardenId, deletedAt: null },
            include: { schedules: true, healthLogs: { orderBy: { loggedAt: 'desc' }, take: 5 } },
            orderBy: { createdAt: 'desc' },
        }));
    }
    listAllPlants(user) {
        const isAdmin = (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.ADMIN) || (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.SUPER_ADMIN);
        return this.prisma.plant.findMany({
            where: {
                deletedAt: null,
                ...(isAdmin
                    ? {}
                    : {
                        OR: [
                            { gardenerId: user.id },
                            { garden: { gardenerId: user.id } },
                        ],
                    }),
            },
            include: {
                garden: { select: { id: true, name: true, gardenType: true } },
                schedules: { orderBy: { nextDueDate: 'asc' } },
                healthLogs: { orderBy: { loggedAt: 'desc' }, take: 5 },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getPlantOrThrow(user, plantId) {
        const plant = await this.prisma.plant.findUnique({
            where: { id: plantId },
            include: {
                garden: true,
                schedules: { orderBy: { nextDueDate: 'asc' } },
                healthLogs: { orderBy: { loggedAt: 'desc' } },
                diagnoses: { orderBy: { createdAt: 'desc' } },
            },
        });
        const isAdmin = (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.ADMIN) || (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.SUPER_ADMIN);
        const ownerId = plant?.gardenerId || plant?.garden?.gardenerId;
        if (!plant || plant.deletedAt || (!isAdmin && ownerId !== user.id)) {
            throw new common_1.NotFoundException('Plant not found.');
        }
        return plant;
    }
    async addCareSchedule(user, dto) {
        const plant = await this.getPlantOrThrow(user, dto.plantId);
        return this.prisma.plantCareSchedule.create({
            data: {
                plantId: plant.id,
                gardenId: plant.gardenId,
                gardenerId: user.id,
                careType: dto.careType,
                title: dto.title,
                instructions: dto.instructions,
                intervalDays: dto.intervalDays || 1,
                nextDueDate: new Date(dto.nextDueDate),
            },
        });
    }
    async completeCareTask(user, scheduleId) {
        const schedule = await this.prisma.plantCareSchedule.findUnique({
            where: { id: scheduleId },
        });
        const isAdmin = (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.ADMIN) || (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.SUPER_ADMIN);
        if (!schedule || (!isAdmin && schedule.gardenerId !== user.id)) {
            throw new common_1.NotFoundException('Care task not found.');
        }
        const now = new Date();
        const nextDate = new Date(now.getTime() + schedule.intervalDays * 24 * 60 * 60 * 1000);
        return this.prisma.plantCareSchedule.update({
            where: { id: scheduleId },
            data: {
                lastCompletedDate: now,
                nextDueDate: nextDate,
            },
        });
    }
    listCareTasks(user, query) {
        const isAdmin = (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.ADMIN) || (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.SUPER_ADMIN);
        const filter = {
            ...(isAdmin ? {} : { gardenerId: user.id }),
        };
        if (query?.dueToday) {
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);
            filter.nextDueDate = { lte: endOfDay };
        }
        return this.prisma.plantCareSchedule.findMany({
            where: filter,
            include: {
                plant: { select: { id: true, name: true, photoUrl: true } },
                garden: { select: { id: true, name: true } },
            },
            orderBy: { nextDueDate: 'asc' },
        });
    }
    async logPlantHealth(user, dto) {
        const plant = await this.getPlantOrThrow(user, dto.plantId);
        const [healthLog] = await this.prisma.$transaction([
            this.prisma.plantHealthLog.create({
                data: {
                    plantId: plant.id,
                    photoUrl: dto.photoUrl,
                    conditionStatus: dto.conditionStatus,
                    notes: dto.notes,
                },
            }),
            this.prisma.plant.update({
                where: { id: plant.id },
                data: {
                    photoUrl: dto.photoUrl,
                    healthStatus: dto.conditionStatus,
                },
            }),
        ]);
        return healthLog;
    }
    async getAiCreditStatus(user) {
        let ledger = await this.prisma.aiCreditLedger.findUnique({
            where: { userId: user.id },
        });
        const { plan } = await this.gardenerPlansService.getEffectivePlan(user.id);
        const isProOrVip = plan === client_1.GardenerSubscriptionPlan.VIP || plan === client_1.GardenerSubscriptionPlan.PRO;
        const quota = isProOrVip ? PREMIUM_GARDENER_MONTHLY_AI_SCANS : FREE_GARDENER_MONTHLY_AI_SCANS;
        if (!ledger) {
            ledger = await this.prisma.aiCreditLedger.create({
                data: {
                    userId: user.id,
                    monthlyQuota: quota,
                    usedThisMonth: 0,
                    resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            });
        }
        else {
            if (new Date() > new Date(ledger.resetDate)) {
                ledger = await this.prisma.aiCreditLedger.update({
                    where: { userId: user.id },
                    data: {
                        usedThisMonth: 0,
                        monthlyQuota: quota,
                        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    },
                });
            }
        }
        const remaining = Math.max(0, (ledger.monthlyQuota + ledger.bonusCredits) - ledger.usedThisMonth);
        return {
            monthlyQuota: ledger.monthlyQuota,
            usedThisMonth: ledger.usedThisMonth,
            bonusCredits: ledger.bonusCredits,
            remainingCredits: remaining,
            resetDate: ledger.resetDate,
            isUnlimited: plan === client_1.GardenerSubscriptionPlan.VIP,
        };
    }
    async diagnoseAndRecord(user, dto) {
        const creditStatus = await this.getAiCreditStatus(user);
        if (creditStatus.remainingCredits <= 0 && !creditStatus.isUnlimited) {
            throw new common_1.ForbiddenException('You have exhausted your monthly free AI plant doctor scans. Upgrade to VIP Garden Pass for unlimited diagnoses.');
        }
        const aiResult = await this.aiChatService.diagnoseLeaf(dto.leafPhotoUrl, 'GARDEN');
        const diagnosis = await this.prisma.plantDiagnosis.create({
            data: {
                gardenerId: user.id,
                plantId: dto.plantId || null,
                leafPhotoUrl: dto.leafPhotoUrl,
                detectedIssue: `${aiResult.cropName}: ${aiResult.diseaseName}`,
                category: aiResult.category || 'FUNGAL',
                confidence: `${aiResult.confidenceScore || 95}%`,
                organicRemedy: aiResult.organicRemedy || 'Ensure balanced watering and adequate indirect sunlight.',
                chemicalRemedy: aiResult.firstAidSpray || null,
                preventiveCare: `${aiResult.dosageInstructions || ''} | ${aiResult.symptoms || ''}`,
            },
        });
        await this.prisma.aiCreditLedger.update({
            where: { userId: user.id },
            data: { usedThisMonth: { increment: 1 } },
        });
        if (dto.plantId) {
            const isHealthy = aiResult.category === 'HEALTHY';
            const status = isHealthy ? 'HEALTHY' : aiResult.severity === 'CRITICAL' ? 'CRITICAL' : 'NEEDS_CARE';
            await this.prisma.$transaction([
                this.prisma.plant.update({
                    where: { id: dto.plantId },
                    data: {
                        healthStatus: status,
                        photoUrl: dto.leafPhotoUrl,
                    },
                }),
                this.prisma.plantHealthLog.create({
                    data: {
                        plantId: dto.plantId,
                        photoUrl: dto.leafPhotoUrl,
                        conditionStatus: status,
                        notes: `${aiResult.diseaseName} detected by AI Plant Doctor (${aiResult.confidenceScore}% confidence). ${aiResult.organicRemedy}`,
                    },
                }),
            ]);
        }
        const updatedCreditStatus = await this.getAiCreditStatus(user);
        return {
            aiResult,
            diagnosis,
            creditStatus: updatedCreditStatus,
        };
    }
    async recordPlantDiagnosis(user, dto, aiResult) {
        const creditStatus = await this.getAiCreditStatus(user);
        if (creditStatus.remainingCredits <= 0 && !creditStatus.isUnlimited) {
            throw new common_1.ForbiddenException('You have exhausted your monthly free AI plant doctor scans. Upgrade to Premium Garden Pass for unlimited diagnoses.');
        }
        const diagnosis = await this.prisma.plantDiagnosis.create({
            data: {
                gardenerId: user.id,
                plantId: dto.plantId || null,
                leafPhotoUrl: dto.leafPhotoUrl,
                detectedIssue: aiResult.diseaseName || 'Healthy Leaf',
                category: aiResult.category || 'ORGANIC_WELLNESS',
                confidence: `${aiResult.confidenceScore || 95}%`,
                organicRemedy: aiResult.organicRemedy || 'Ensure balanced watering and adequate indirect sunlight.',
                chemicalRemedy: aiResult.firstAidSpray || null,
                preventiveCare: aiResult.dosageInstructions || null,
            },
        });
        await this.prisma.aiCreditLedger.update({
            where: { userId: user.id },
            data: { usedThisMonth: { increment: 1 } },
        });
        return diagnosis;
    }
    listDiagnoses(user, plantId) {
        const isAdmin = (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.ADMIN) || (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.SUPER_ADMIN);
        return this.prisma.plantDiagnosis.findMany({
            where: {
                ...(isAdmin ? {} : { gardenerId: user.id }),
                ...(plantId ? { plantId } : {}),
            },
            include: {
                plant: { select: { id: true, name: true, locationType: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async addExpense(user, dto) {
        if (!dto.gardenId) {
            throw new common_1.BadRequestException('Garden ID is required.');
        }
        await this.findOneOrThrow(user, dto.gardenId);
        return this.prisma.gardenExpense.create({
            data: {
                gardenId: dto.gardenId,
                plantId: dto.plantId,
                categoryName: dto.category || dto.title || 'General',
                amount: dto.amount,
                expenseDate: dto.date ? new Date(dto.date) : new Date(),
                description: dto.note || dto.description,
                recordedById: user.id,
            },
        });
    }
    listExpenses(user) {
        return this.prisma.gardenExpense.findMany({
            where: { recordedById: user.id },
            include: {
                garden: { select: { id: true, name: true } },
                plant: { select: { id: true, name: true } },
            },
            orderBy: { expenseDate: 'desc' },
        });
    }
    async deleteExpense(user, id) {
        const expense = await this.prisma.gardenExpense.findUnique({ where: { id } });
        const isAdmin = (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.ADMIN) || (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.SUPER_ADMIN);
        if (!expense || (!isAdmin && expense.recordedById !== user.id)) {
            throw new common_1.NotFoundException('Expense not found.');
        }
        return this.prisma.gardenExpense.delete({ where: { id } });
    }
    async verifyDoctorAccessOrThrow(doctorUser, gardenerId) {
        const isAdmin = (0, auth_user_util_1.hasActiveRole)(doctorUser, client_1.Role.ADMIN) || (0, auth_user_util_1.hasActiveRole)(doctorUser, client_1.Role.SUPER_ADMIN);
        if (isAdmin)
            return true;
        const assignment = await this.prisma.advisorAssignment.findFirst({
            where: {
                advisorId: doctorUser.id,
                farmerId: gardenerId,
                status: client_1.AdvisorAssignmentStatus.ACTIVE,
                deletedAt: null,
            },
        });
        if (!assignment) {
            throw new common_1.ForbiddenException('You are not assigned as the horticultural advisor for this gardener.');
        }
        return true;
    }
    async getBotanicalProfileForDoctor(doctorUser, gardenerId) {
        await this.verifyDoctorAccessOrThrow(doctorUser, gardenerId);
        const gardener = await this.prisma.user.findUnique({
            where: { id: gardenerId },
            select: {
                id: true,
                name: true,
                mobile: true,
                kingId: true,
                photoUrl: true,
                village: true,
                district: true,
                state: true,
                gardenerPlan: { select: { plan: true, startDate: true, endDate: true } },
            },
        });
        if (!gardener) {
            throw new common_1.NotFoundException('Gardener not found.');
        }
        const [gardens, standalonePlants, diagnoses] = await Promise.all([
            this.prisma.garden.findMany({
                where: { gardenerId },
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
                    visits: { orderBy: { scheduledTime: 'desc' }, take: 5 },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.plant.findMany({
                where: { gardenerId, gardenId: null, deletedAt: null },
                include: {
                    schedules: { orderBy: { nextDueDate: 'asc' } },
                    healthLogs: { orderBy: { loggedAt: 'desc' }, take: 10 },
                    diagnoses: { orderBy: { createdAt: 'desc' }, take: 5 },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.plantDiagnosis.findMany({
                where: { gardenerId },
                include: { plant: { select: { id: true, name: true, locationType: true } } },
                orderBy: { createdAt: 'desc' },
                take: 20,
            }),
        ]);
        return {
            gardener,
            gardens,
            standalonePlants,
            diagnoses,
        };
    }
    async prescribeCareSchedule(doctorUser, dto) {
        await this.verifyDoctorAccessOrThrow(doctorUser, dto.gardenerId);
        const nextDueDate = dto.nextDueDate
            ? new Date(dto.nextDueDate)
            : new Date(Date.now() + (dto.intervalDays || 1) * 86400000);
        let effectivePlantId = dto.plantId;
        if (!effectivePlantId && dto.gardenId) {
            const firstPlant = await this.prisma.plant.findFirst({
                where: { gardenId: dto.gardenId, deletedAt: null },
            });
            if (firstPlant)
                effectivePlantId = firstPlant.id;
        }
        if (!effectivePlantId) {
            const anyPlant = await this.prisma.plant.findFirst({
                where: { gardenerId: dto.gardenerId, deletedAt: null },
            });
            if (anyPlant)
                effectivePlantId = anyPlant.id;
        }
        if (!effectivePlantId) {
            throw new common_1.BadRequestException('A target plant must be registered before prescribing care routines.');
        }
        const schedule = await this.prisma.plantCareSchedule.create({
            data: {
                gardenerId: dto.gardenerId,
                plantId: effectivePlantId,
                gardenId: dto.gardenId || null,
                careType: dto.careType,
                title: dto.title,
                instructions: dto.instructions || null,
                intervalDays: dto.intervalDays,
                nextDueDate,
            },
        });
        if (dto.plantId) {
            await this.prisma.plantHealthLog.create({
                data: {
                    plantId: dto.plantId,
                    photoUrl: '',
                    conditionStatus: 'DOCTOR_PRESCRIBED',
                    notes: `Prescription issued by Certified Garden Doctor: ${dto.title} (${dto.careType}). ${dto.instructions || ''}`,
                },
            });
        }
        return schedule;
    }
    async recordDoctorConsultationNote(doctorUser, dto) {
        await this.verifyDoctorAccessOrThrow(doctorUser, dto.gardenerId);
        const log = await this.prisma.plantHealthLog.create({
            data: {
                plantId: dto.plantId,
                photoUrl: dto.photoUrl || '',
                conditionStatus: dto.conditionStatus || 'DOCTOR_PRESCRIBED',
                notes: `Clinical Consultation Note: ${dto.notes}`,
            },
        });
        if (dto.conditionStatus) {
            await this.prisma.plant.update({
                where: { id: dto.plantId },
                data: { healthStatus: dto.conditionStatus, healthNotes: dto.notes },
            });
        }
        return log;
    }
    async getDoctorGardenDashboard(doctorUser) {
        const isAdmin = (0, auth_user_util_1.hasActiveRole)(doctorUser, client_1.Role.ADMIN) || (0, auth_user_util_1.hasActiveRole)(doctorUser, client_1.Role.SUPER_ADMIN);
        const activeAssignments = await this.prisma.advisorAssignment.findMany({
            where: {
                ...(isAdmin ? {} : { advisorId: doctorUser.id }),
                status: client_1.AdvisorAssignmentStatus.ACTIVE,
                deletedAt: null,
                farmer: {
                    deletedAt: null,
                    OR: [{ role: client_1.Role.GARDENER }, { roles: { has: client_1.Role.GARDENER } }],
                },
            },
            include: {
                farmer: {
                    select: {
                        id: true,
                        name: true,
                        mobile: true,
                        kingId: true,
                        photoUrl: true,
                        village: true,
                        district: true,
                        state: true,
                        gardenerPlan: { select: { plan: true, endDate: true } },
                        gardens: {
                            select: {
                                id: true,
                                name: true,
                                gardenType: true,
                                healthScore: true,
                                plants: { select: { id: true, name: true, healthStatus: true } },
                            },
                        },
                        plants: {
                            where: { gardenId: null, deletedAt: null },
                            select: { id: true, name: true, healthStatus: true },
                        },
                    },
                },
            },
            orderBy: { startDate: 'desc' },
        });
        const pendingAssignments = await this.prisma.advisorAssignment.findMany({
            where: {
                ...(isAdmin ? {} : { advisorId: doctorUser.id }),
                status: client_1.AdvisorAssignmentStatus.PENDING,
                deletedAt: null,
            },
            include: {
                farmer: {
                    select: {
                        id: true,
                        name: true,
                        mobile: true,
                        kingId: true,
                        photoUrl: true,
                        village: true,
                        district: true,
                        state: true,
                    },
                },
            },
            orderBy: { startDate: 'desc' },
        });
        const gardenerIds = activeAssignments.map((a) => a.farmerId);
        const recentDiagnoses = gardenerIds.length
            ? await this.prisma.plantDiagnosis.findMany({
                where: { gardenerId: { in: gardenerIds } },
                include: {
                    gardener: { select: { id: true, name: true, mobile: true } },
                    plant: { select: { id: true, name: true, locationType: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            })
            : [];
        let totalMonitoredGardens = 0;
        let totalMonitoredPlants = 0;
        let criticalPlantsCount = 0;
        activeAssignments.forEach((a) => {
            totalMonitoredGardens += a.farmer.gardens.length;
            a.farmer.gardens.forEach((g) => {
                totalMonitoredPlants += g.plants.length;
                g.plants.forEach((p) => {
                    if (p.healthStatus === 'CRITICAL' || p.healthStatus === 'NEEDS_CARE')
                        criticalPlantsCount++;
                });
            });
            totalMonitoredPlants += a.farmer.plants.length;
            a.farmer.plants.forEach((p) => {
                if (p.healthStatus === 'CRITICAL' || p.healthStatus === 'NEEDS_CARE')
                    criticalPlantsCount++;
            });
        });
        const [credits, debits] = await Promise.all([
            this.prisma.walletTransaction.aggregate({
                where: { userId: doctorUser.id, type: 'CREDIT' },
                _sum: { amount: true },
            }),
            this.prisma.walletTransaction.aggregate({
                where: { userId: doctorUser.id, type: 'DEBIT' },
                _sum: { amount: true },
            }),
        ]);
        const balance = (Number(credits._sum.amount) || 0) - (Number(debits._sum.amount) || 0);
        return {
            activeGardenersCount: activeAssignments.length,
            pendingRequestsCount: pendingAssignments.length,
            monitoredGardensCount: totalMonitoredGardens,
            monitoredPlantsCount: totalMonitoredPlants,
            criticalPlantsCount,
            activeAssignments,
            pendingAssignments,
            recentDiagnoses,
            wallet: { balance: Math.max(0, balance), totalEarnings: Number(credits._sum.amount) || 0 },
        };
    }
};
exports.GardensService = GardensService;
exports.GardensService = GardensService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        gardener_plans_service_1.GardenerPlansService,
        ai_chat_service_1.AiChatService])
], GardensService);
//# sourceMappingURL=gardens.service.js.map