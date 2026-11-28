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
exports.AdvisorAssignmentService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const wallet_service_1 = require("../wallet/wallet.service");
const whatsapp_group_sync_service_1 = require("../whatsapp/whatsapp-group-sync.service");
const app_settings_service_1 = require("../app-settings/app-settings.service");
const auth_user_util_1 = require("../../common/utils/auth-user.util");
let AdvisorAssignmentService = class AdvisorAssignmentService {
    constructor(prisma, notificationsService, walletService, whatsAppGroupSyncService, appSettingsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.walletService = walletService;
        this.whatsAppGroupSyncService = whatsAppGroupSyncService;
        this.appSettingsService = appSettingsService;
        this.STANDARD_OR_PREMIUM_FARMER_CLAUSE = {
            farmer: { farmerPlan: { plan: { in: [client_1.FarmerSubscriptionPlan.PRO, client_1.FarmerSubscriptionPlan.SMART, client_1.FarmerSubscriptionPlan.SUPER, client_1.FarmerSubscriptionPlan.VIP] } } },
        };
        this.FARMER_BASIC_SELECT = {
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
        };
    }
    async onApplicationBootstrap() {
    }
    async getFarmerStats(user) {
        const [active, inactive] = await Promise.all([
            this.prisma.advisorAssignment.count({
                where: { advisorId: user.id, status: client_1.AdvisorAssignmentStatus.ACTIVE, deletedAt: null, ...this.STANDARD_OR_PREMIUM_FARMER_CLAUSE },
            }),
            this.prisma.advisorAssignment.count({
                where: { advisorId: user.id, status: client_1.AdvisorAssignmentStatus.REVOKED, deletedAt: null, ...this.STANDARD_OR_PREMIUM_FARMER_CLAUSE },
            }),
        ]);
        return { total: active + inactive, active, inactive };
    }
    isAssignmentExpired(assignment) {
        return !!assignment.subscription?.endDate && assignment.subscription.endDate < new Date();
    }
    notExpiredClause() {
        return {
            OR: [{ subscriptionId: null }, { subscription: { endDate: null } }, { subscription: { endDate: { gt: new Date() } } }],
        };
    }
    findFarmersByStatus(user, status) {
        const requiredType = this.roleToAdvisorType(user);
        const clientRoleClause = requiredType === client_1.AdvisorType.GARDEN
            ? { OR: [{ role: client_1.Role.GARDENER }, { roles: { has: client_1.Role.GARDENER } }] }
            : { OR: [{ role: client_1.Role.FARMER }, { roles: { has: client_1.Role.FARMER } }] };
        const statusFilter = status === 'ACTIVE'
            ? client_1.AdvisorAssignmentStatus.ACTIVE
            : status === 'INACTIVE'
                ? client_1.AdvisorAssignmentStatus.REVOKED
                : status === 'PENDING'
                    ? client_1.AdvisorAssignmentStatus.PENDING
                    : { in: [client_1.AdvisorAssignmentStatus.ACTIVE, client_1.AdvisorAssignmentStatus.REVOKED, client_1.AdvisorAssignmentStatus.PENDING] };
        const activeClause = status === 'ACTIVE'
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
    async findFarmerDetail(user, farmerId) {
        const assignment = await this.prisma.advisorAssignment.findFirst({
            where: {
                farmerId,
                deletedAt: null,
                ...((0, auth_user_util_1.hasActiveRole)(user, client_1.Role.ADMIN) || (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.SUPER_ADMIN) ? {} : { advisorId: user.id }),
            },
            include: { subscription: { include: { plan: true } } },
            orderBy: { startDate: 'desc' },
        });
        if (!assignment && !(0, auth_user_util_1.hasActiveRole)(user, client_1.Role.ADMIN) && !(0, auth_user_util_1.hasActiveRole)(user, client_1.Role.SUPER_ADMIN)) {
            throw new common_1.ForbiddenException('You are not assigned to view this farmer profile.');
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
            throw new common_1.NotFoundException('Farmer not found.');
        }
        return {
            farmer: {
                ...farmer,
                farms: farmer.farms ?? [],
                gardens: farmer.gardens ?? [],
                plants: farmer.plants ?? [],
            },
            assignment,
            isExpired,
        };
    }
    async getDoctorRatingStats(advisorIds) {
        if (!advisorIds.length)
            return new Map();
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
        const map = new Map();
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
    async findMyAdvisor(user) {
        const assignment = await this.prisma.advisorAssignment.findFirst({
            where: { farmerId: user.id, status: client_1.AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
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
        if (!assignment || !assignment.advisor)
            return assignment;
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
    async listAvailableAdvisors(user) {
        const requiredType = this.roleToAdvisorType(user);
        const advisors = await this.prisma.user.findMany({
            where: {
                AND: [
                    { OR: [{ role: client_1.Role.ADVISOR }, { roles: { has: client_1.Role.ADVISOR } }] },
                    {
                        OR: [
                            { advisorType: requiredType },
                            ...(requiredType === client_1.AdvisorType.FARM ? [{ advisorType: null }] : []),
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
                _count: { select: { advisorAssignmentsAsAdvisor: { where: { status: client_1.AdvisorAssignmentStatus.ACTIVE } } } },
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
    async listAvailableAdvisorsForCrop(user, cropCycleId) {
        const cropCycle = await this.prisma.cropCycle.findFirst({
            where: { id: cropCycleId, deletedAt: null },
            include: {
                plot: { include: { farm: true } },
            },
        });
        if (!cropCycle) {
            throw new common_1.NotFoundException('Crop cycle not found.');
        }
        const requiredType = this.roleToAdvisorType(user);
        const advisors = await this.prisma.user.findMany({
            where: {
                AND: [
                    { OR: [{ role: client_1.Role.ADVISOR }, { roles: { has: client_1.Role.ADVISOR } }] },
                    {
                        OR: [
                            { advisorType: requiredType },
                            ...(requiredType === client_1.AdvisorType.FARM ? [{ advisorType: null }] : []),
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
                _count: { select: { advisorAssignmentsAsAdvisor: { where: { status: client_1.AdvisorAssignmentStatus.ACTIVE } } } },
            },
            orderBy: { createdAt: 'asc' },
        });
        const ratingMap = await this.getDoctorRatingStats(advisors.map((a) => a.id));
        const matchingAdvisors = advisors.filter((advisor) => {
            const hasCategories = Array.isArray(advisor.specializedCategories) && advisor.specializedCategories.length > 0;
            const hasCrops = Array.isArray(advisor.specializedCrops) && advisor.specializedCrops.length > 0;
            if (!hasCategories && !hasCrops)
                return true;
            if (hasCrops && advisor.specializedCrops.some((sc) => {
                const up = sc.toUpperCase().trim();
                return up === 'ALL' || up === 'ALL_CROPS' || up === 'ALL CROPS' || up.includes('ALL CROP');
            })) {
                return true;
            }
            let categoryMatch = false;
            if (hasCategories && cropCycle.category) {
                categoryMatch = advisor.specializedCategories.includes(cropCycle.category);
            }
            let cropNameMatch = false;
            if (hasCrops && cropCycle.cropName) {
                const cLower = cropCycle.cropName.toLowerCase();
                cropNameMatch = advisor.specializedCrops.some((sc) => sc.toLowerCase().includes(cLower) || cLower.includes(sc.toLowerCase()));
            }
            if (hasCategories && hasCrops) {
                return categoryMatch || cropNameMatch;
            }
            if (hasCategories)
                return categoryMatch;
            if (hasCrops)
                return cropNameMatch;
            return true;
        });
        const results = await Promise.all(matchingAdvisors.map(async ({ _count, ...advisor }) => {
            const rStats = ratingMap.get(advisor.id) ?? { rating: null, ratingCount: 0, ratingLabel: 'No rating till now' };
            const activeSub = await this.prisma.advisorSubscription.findFirst({
                where: {
                    farmerId: user.id,
                    status: client_1.SubscriptionPlanStatus.ACTIVE,
                    endDate: { gt: new Date() },
                    advisorAssignment: { advisorId: advisor.id },
                },
                select: { id: true, endDate: true },
            });
            let quotaStatus = 'NOT_SUBSCRIBED';
            let freeSlotsRemaining = 0;
            let activeCropsUnderAdvisor = 0;
            const maxIncluded = advisor.monthlyIncludedCrops ?? 3;
            if (activeSub) {
                activeCropsUnderAdvisor = await this.prisma.cropCycle.count({
                    where: {
                        assignedAdvisorId: advisor.id,
                        deletedAt: null,
                        status: { notIn: [client_1.CropStatus.COMPLETED, client_1.CropStatus.FAILED] },
                    },
                });
                freeSlotsRemaining = Math.max(0, maxIncluded - activeCropsUnderAdvisor);
                quotaStatus = freeSlotsRemaining > 0 ? 'INCLUDED_FREE' : 'ADDITIONAL_CROP_FEE';
            }
            const isAlreadyAssigned = Boolean(cropCycle.assignedAdvisorId === advisor.id &&
                cropCycle.advisorReviewStatus !== client_1.CropAdvisorReviewStatus.NONE);
            return {
                ...advisor,
                activeFarmerCount: _count.advisorAssignmentsAsAdvisor,
                ...rStats,
                isAlreadyAssignedToThisCrop: isAlreadyAssigned,
                assignedCropReviewStatus: isAlreadyAssigned ? cropCycle.advisorReviewStatus : null,
                activeHiringModelForCrop: isAlreadyAssigned ? cropCycle.hiringModel : null,
                quota: {
                    hasActiveMonthlySubscription: !!activeSub,
                    activeSubscriptionId: activeSub?.id ?? null,
                    subscriptionEndDate: activeSub?.endDate ?? null,
                    quotaStatus,
                    monthlyIncludedCrops: maxIncluded,
                    activeCropsUnderAdvisor,
                    freeSlotsRemaining,
                    additionalCropFee: Number(advisor.feeAdditionalCropMonthly ?? 300),
                },
            };
        }));
        results.sort((a, b) => {
            if (a.quota.quotaStatus === 'INCLUDED_FREE' && b.quota.quotaStatus !== 'INCLUDED_FREE')
                return -1;
            if (b.quota.quotaStatus === 'INCLUDED_FREE' && a.quota.quotaStatus !== 'INCLUDED_FREE')
                return 1;
            return (b.rating ?? 0) - (a.rating ?? 0);
        });
        return results;
    }
    async assertAdvisorAssignedToFarmer(advisorId, farmerId) {
        const assignment = await this.prisma.advisorAssignment.findFirst({
            where: { advisorId, farmerId, status: client_1.AdvisorAssignmentStatus.ACTIVE, deletedAt: null, ...this.notExpiredClause() },
        });
        if (!assignment) {
            throw new common_1.NotFoundException('You are not the assigned advisor for this farmer.');
        }
        return assignment;
    }
    async assertAdvisorAssignedToFarmerAnyExpiry(advisorId, farmerId) {
        const assignment = await this.prisma.advisorAssignment.findFirst({
            where: { advisorId, farmerId, status: client_1.AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
        });
        if (!assignment) {
            throw new common_1.NotFoundException('You are not the assigned advisor for this farmer.');
        }
        return assignment;
    }
    async pickAdvisorForAssignment(advisorType) {
        const sudhirAdvisor = await this.prisma.user.findFirst({
            where: {
                name: { contains: 'Sudhir', mode: 'insensitive' },
                AND: [
                    { OR: [{ role: client_1.Role.ADVISOR }, { roles: { has: client_1.Role.ADVISOR } }] },
                    {
                        OR: [
                            { advisorType },
                            ...(advisorType === client_1.AdvisorType.FARM ? [{ advisorType: null }] : []),
                        ],
                    },
                ],
                deletedAt: null,
            },
            select: { id: true },
        });
        if (sudhirAdvisor && advisorType === client_1.AdvisorType.FARM) {
            return sudhirAdvisor.id;
        }
        const advisors = await this.prisma.user.findMany({
            where: {
                AND: [
                    { OR: [{ role: client_1.Role.ADVISOR }, { roles: { has: client_1.Role.ADVISOR } }] },
                    {
                        OR: [
                            { advisorType },
                            ...(advisorType === client_1.AdvisorType.FARM ? [{ advisorType: null }] : []),
                        ],
                    },
                ],
                deletedAt: null,
            },
            select: {
                id: true,
                _count: { select: { advisorAssignmentsAsAdvisor: { where: { status: client_1.AdvisorAssignmentStatus.ACTIVE } } } },
            },
        });
        if (advisors.length === 0) {
            throw new common_1.NotFoundException(`No ${advisorType === client_1.AdvisorType.FARM ? 'Crop Doctor / Farm Advisor' : 'Garden Advisor'} is available right now.`);
        }
        advisors.sort((a, b) => a._count.advisorAssignmentsAsAdvisor - b._count.advisorAssignmentsAsAdvisor);
        return advisors[0].id;
    }
    roleToAdvisorType(user) {
        if (user && (0, auth_user_util_1.hasActiveRole)(user, client_1.Role.GARDENER))
            return client_1.AdvisorType.GARDEN;
        return client_1.AdvisorType.FARM;
    }
    async createFromSubscription(subscriptionId, farmerId) {
        const assignee = await this.prisma.user.findFirst({ where: { id: farmerId, deletedAt: null } });
        if (!assignee) {
            throw new common_1.NotFoundException('User not found.');
        }
        const advisorType = this.roleToAdvisorType(assignee);
        const advisorId = await this.pickAdvisorForAssignment(advisorType);
        const assignment = await this.prisma.advisorAssignment.create({
            data: {
                advisorId,
                farmerId,
                subscriptionId,
                status: client_1.AdvisorAssignmentStatus.PENDING,
                assignedById: farmerId,
                startDate: new Date(),
            },
            include: { advisor: { select: { id: true, name: true, mobile: true } } },
        });
        await this.notificationsService.create(advisorId, client_1.NotificationType.SYSTEM, 'New farmer hire request', `${assignee.name} wants to hire you as their advisor. Review their profile and accept or reject.`);
        return assignment;
    }
    findMyPendingRequest(user) {
        return this.prisma.advisorAssignment.findFirst({
            where: {
                farmerId: user.id,
                status: { in: [client_1.AdvisorAssignmentStatus.PENDING, client_1.AdvisorAssignmentStatus.ADMIN_APPROVAL_PENDING] },
                deletedAt: null,
            },
            include: {
                advisor: { select: { id: true, name: true, photoUrl: true, specialization: true } },
            },
            orderBy: { startDate: 'desc' },
        });
    }
    async requestSpecificAdvisor(farmerId, advisorId, cropId) {
        let cropName = '';
        let cropVariety = '';
        let selectedCrop = null;
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
                status: { in: [client_1.AdvisorAssignmentStatus.PENDING, client_1.AdvisorAssignmentStatus.ADMIN_APPROVAL_PENDING, client_1.AdvisorAssignmentStatus.ACTIVE] },
                deletedAt: null,
            },
        });
        if (existingSame) {
            if (cropId && selectedCrop) {
                await this.prisma.cropCycle.update({
                    where: { id: cropId },
                    data: { advisorReviewStatus: 'PENDING', submittedToAdvisorAt: new Date() },
                });
            }
            return existingSame;
        }
        const farmer = await this.prisma.user.findFirst({ where: { id: farmerId, deletedAt: null } });
        if (!farmer) {
            throw new common_1.NotFoundException('User not found.');
        }
        const currentActive = await this.prisma.advisorAssignment.findFirst({
            where: { farmerId, status: client_1.AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
            include: { advisor: { select: { id: true, name: true, mobile: true } } },
        });
        const isDoctorChange = !!currentActive && currentActive.advisorId !== advisorId && !cropId;
        const initialStatus = isDoctorChange
            ? client_1.AdvisorAssignmentStatus.ADMIN_APPROVAL_PENDING
            : client_1.AdvisorAssignmentStatus.PENDING;
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
                data: { advisorReviewStatus: 'PENDING', submittedToAdvisorAt: new Date() },
            });
        }
        if (isDoctorChange) {
            const admins = await this.prisma.user.findMany({
                where: { roles: { hasSome: [client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN] }, deletedAt: null },
                select: { id: true },
            });
            for (const admin of admins) {
                await this.notificationsService.create(admin.id, client_1.NotificationType.SYSTEM, 'Doctor Change Request Pending Review', `Farmer ${farmer.name} requested to switch doctor from Dr. ${currentActive?.advisor?.name} to Dr. ${assignment.advisor.name}. Admin review required.`);
            }
            await this.notificationsService.create(farmerId, client_1.NotificationType.SYSTEM, 'Doctor Change Request Submitted', 'Your request to change crop doctor has been submitted to Admin for approval. Admin will notify your current doctor.');
        }
        else {
            await this.notificationsService.create(advisorId, client_1.NotificationType.SYSTEM, cropName ? `New Crop Care Request: ${cropName}` : 'New farmer hire request', `${farmer.name} wants to hire you as crop advisor${cropName ? ` for "${cropName}"` : ''}. Review details and accept or decline.`, { cropCycleId: cropId || undefined, farmerId });
        }
        return assignment;
    }
    async findPendingDoctorChangeRequests() {
        return this.prisma.advisorAssignment.findMany({
            where: { status: client_1.AdvisorAssignmentStatus.ADMIN_APPROVAL_PENDING, deletedAt: null },
            include: {
                farmer: { select: { id: true, name: true, mobile: true, kingId: true, state: true, district: true } },
                advisor: { select: { id: true, name: true, mobile: true, photoUrl: true, specialization: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async adminApproveDoctorChange(adminUser, assignmentId) {
        const assignment = await this.prisma.advisorAssignment.findFirst({
            where: { id: assignmentId, status: client_1.AdvisorAssignmentStatus.ADMIN_APPROVAL_PENDING, deletedAt: null },
            include: {
                farmer: { select: { id: true, name: true, mobile: true } },
                advisor: { select: { id: true, name: true, mobile: true } },
            },
        });
        if (!assignment) {
            throw new common_1.NotFoundException('Pending Doctor Change Request not found.');
        }
        const currentActive = await this.prisma.advisorAssignment.findFirst({
            where: { farmerId: assignment.farmerId, status: client_1.AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
            include: { advisor: { select: { id: true, name: true } } },
        });
        if (currentActive) {
            await this.notificationsService.create(currentActive.advisorId, client_1.NotificationType.SYSTEM, 'Farmer Doctor Change Notice', `Farmer ${assignment.farmer.name} is changing their crop doctor. Admin has approved the request.`);
        }
        const updated = await this.prisma.advisorAssignment.update({
            where: { id: assignmentId },
            data: { status: client_1.AdvisorAssignmentStatus.PENDING },
        });
        await this.notificationsService.create(assignment.advisorId, client_1.NotificationType.SYSTEM, 'New farmer hire request', `${assignment.farmer.name} wants to hire you as their advisor. Review their profile and accept or reject.`);
        await this.notificationsService.create(assignment.farmerId, client_1.NotificationType.SYSTEM, 'Doctor Change Request Approved by Admin', `Admin approved your doctor change request! Request has been forwarded to Dr. ${assignment.advisor.name}.`);
        return updated;
    }
    async adminRejectDoctorChange(adminUser, assignmentId, reason) {
        const assignment = await this.prisma.advisorAssignment.findFirst({
            where: { id: assignmentId, status: client_1.AdvisorAssignmentStatus.ADMIN_APPROVAL_PENDING, deletedAt: null },
        });
        if (!assignment) {
            throw new common_1.NotFoundException('Pending Doctor Change Request not found.');
        }
        const updated = await this.prisma.advisorAssignment.update({
            where: { id: assignmentId },
            data: {
                status: client_1.AdvisorAssignmentStatus.REVOKED,
                endDate: new Date(),
                notes: `Doctor change rejected by Admin: ${reason || 'No reason specified'}`,
            },
        });
        await this.notificationsService.create(assignment.farmerId, client_1.NotificationType.SYSTEM, 'Doctor Change Request Update', `Your doctor change request was not approved by Admin${reason ? `: ${reason}` : '.'}`);
        return updated;
    }
    async cancelMyPendingRequest(user) {
        const pending = await this.prisma.advisorAssignment.findFirst({
            where: { farmerId: user.id, status: client_1.AdvisorAssignmentStatus.PENDING, deletedAt: null },
        });
        if (!pending) {
            throw new common_1.NotFoundException('No pending advisor request found.');
        }
        const updated = await this.prisma.advisorAssignment.update({
            where: { id: pending.id },
            data: { status: client_1.AdvisorAssignmentStatus.REVOKED, endDate: new Date(), notes: 'Cancelled by farmer' },
        });
        return updated;
    }
    async accept(user, id) {
        const assignment = await this.prisma.advisorAssignment.findFirst({
            where: { id, advisorId: user.id, deletedAt: null },
        });
        if (!assignment) {
            throw new common_1.NotFoundException('Hire request not found.');
        }
        if (assignment.status !== client_1.AdvisorAssignmentStatus.PENDING) {
            throw new common_1.ConflictException('This request has already been responded to.');
        }
        const updated = await this.prisma.advisorAssignment.update({
            where: { id },
            data: { status: client_1.AdvisorAssignmentStatus.ACTIVE, startDate: new Date() },
        });
        await this.prisma.advisorAssignment.updateMany({
            where: {
                farmerId: assignment.farmerId,
                id: { not: assignment.id },
                status: { in: [client_1.AdvisorAssignmentStatus.ACTIVE, client_1.AdvisorAssignmentStatus.PENDING] },
                deletedAt: null,
            },
            data: { status: client_1.AdvisorAssignmentStatus.REVOKED, endDate: new Date(), notes: 'Replaced by new doctor acceptance' },
        });
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
                        advisorReviewStatus: 'ACCEPTED',
                        advisorAcceptedAt: new Date(),
                    },
                });
            }
        }
        await this.payoutAdvisorShareOnAccept(assignment.farmerId, user.id);
        await this.notificationsService.create(assignment.farmerId, client_1.NotificationType.SYSTEM, '👨‍⚕️ Doctor Working on Request', `Dr. ${user.name} has accepted your hire request and is actively working on your farm advisory.`, { advisorId: user.id, status: 'WORKING' });
        this.whatsAppGroupSyncService.syncSingleFarmerGroupStatus(assignment.farmerId).catch(() => { });
        return updated;
    }
    async payoutAdvisorShareOnAccept(farmerId, advisorId) {
        const plan = await this.prisma.farmerPlan.findUnique({ where: { farmerId } });
        if (!plan?.endDate || plan.endDate <= new Date())
            return;
        if (plan.plan === client_1.FarmerSubscriptionPlan.FREE)
            return;
        const pricing = await this.prisma.farmerPlanPricing.findFirst({ where: { plan: plan.plan } });
        if (!pricing?.advisorShareValue)
            return;
        const daysRemaining = Math.ceil((plan.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        const ratio = daysRemaining / pricing.billingPeriodDays;
        const amount = Math.round(Number(pricing.advisorShareValue) * ratio * 100) / 100;
        if (amount <= 0)
            return;
        const farmer = await this.prisma.user.findUnique({ where: { id: farmerId }, select: { name: true, kingId: true } });
        const advisor = await this.prisma.user.findUnique({ where: { id: advisorId }, select: { id: true, seniorDoctorId: true, name: true } });
        const recipientId = advisor?.seniorDoctorId || advisorId;
        const farmerLabel = farmer ? `${farmer.name}${farmer.kingId ? ` (ID: ${farmer.kingId})` : ''}` : 'a farmer';
        const advisorLabel = advisor?.seniorDoctorId ? ` (via Assistant Doctor ${advisor.name})` : '';
        await this.walletService.credit(recipientId, amount, `Advisor fee for ${plan.plan} plan — accepted ${farmerLabel}${advisorLabel} on ${new Date().toLocaleDateString('en-IN')}`, { relatedUserId: farmerId });
    }
    async reject(user, id, reason) {
        const assignment = await this.prisma.advisorAssignment.findFirst({
            where: { id, advisorId: user.id, deletedAt: null },
        });
        if (!assignment) {
            throw new common_1.NotFoundException('Hire request not found.');
        }
        if (assignment.status !== client_1.AdvisorAssignmentStatus.PENDING) {
            throw new common_1.ConflictException('This request has already been responded to.');
        }
        const updated = await this.prisma.advisorAssignment.update({
            where: { id },
            data: { status: client_1.AdvisorAssignmentStatus.REVOKED, endDate: new Date(), notes: reason?.trim() || undefined },
        });
        await this.notificationsService.create(assignment.farmerId, client_1.NotificationType.SYSTEM, 'Advisor request declined', reason?.trim()
            ? `Your advisor request was declined: ${reason.trim()}. You can send another request.`
            : 'Your advisor request was declined. You can send another request.');
        this.whatsAppGroupSyncService.syncSingleFarmerGroupStatus(assignment.farmerId).catch(() => { });
        return updated;
    }
    async create(user, dto) {
        const existing = await this.prisma.advisorAssignment.findFirst({
            where: { farmerId: dto.farmerId, status: client_1.AdvisorAssignmentStatus.ACTIVE, deletedAt: null },
        });
        if (existing) {
            throw new common_1.ConflictException('This farmer already has an active advisor assignment.');
        }
        const [advisor, assignee] = await Promise.all([
            this.prisma.user.findFirst({ where: { id: dto.advisorId, deletedAt: null } }),
            this.prisma.user.findFirst({ where: { id: dto.farmerId, deletedAt: null } }),
        ]);
        if (!advisor || !(0, auth_user_util_1.hasActiveRole)(advisor, client_1.Role.ADVISOR)) {
            throw new common_1.BadRequestException('advisorId must belong to a user with the ADVISOR role.');
        }
        if (!assignee) {
            throw new common_1.NotFoundException('User not found.');
        }
        const requiredType = this.roleToAdvisorType(assignee);
        if (advisor.advisorType !== requiredType) {
            throw new common_1.BadRequestException(`A ${requiredType === client_1.AdvisorType.FARM ? 'Farm' : 'Garden'} Advisor is required for this user.`);
        }
        return this.prisma.advisorAssignment.create({
            data: {
                advisorId: dto.advisorId,
                farmerId: dto.farmerId,
                subscriptionId: dto.subscriptionId,
                status: client_1.AdvisorAssignmentStatus.ACTIVE,
                assignedById: user.id,
                startDate: new Date(),
            },
        });
    }
    async findOneOrThrow(user, id) {
        const assignment = await this.prisma.advisorAssignment.findFirst({ where: { id, deletedAt: null } });
        if (!assignment ||
            (user.role !== client_1.Role.ADMIN &&
                user.role !== client_1.Role.SUPER_ADMIN &&
                assignment.advisorId !== user.id &&
                assignment.farmerId !== user.id)) {
            throw new common_1.NotFoundException('Advisor assignment not found.');
        }
        return assignment;
    }
    async revoke(user, id) {
        const assignment = await this.findOneOrThrow(user, id);
        const updated = await this.prisma.advisorAssignment.update({
            where: { id },
            data: { status: client_1.AdvisorAssignmentStatus.REVOKED, endDate: new Date() },
        });
        this.whatsAppGroupSyncService.syncSingleFarmerGroupStatus(assignment.farmerId).catch(() => { });
        return updated;
    }
    async sendRenewalReminder(user, farmerId) {
        const hadAssignment = await this.prisma.advisorAssignment.findFirst({
            where: { advisorId: user.id, farmerId, deletedAt: null },
        });
        if (!hadAssignment) {
            throw new common_1.NotFoundException('This farmer has never been assigned to you.');
        }
        const farmer = await this.prisma.user.findFirst({ where: { id: farmerId, deletedAt: null }, select: { name: true } });
        if (!farmer) {
            throw new common_1.NotFoundException('Farmer not found.');
        }
        await this.notificationsService.create(farmerId, client_1.NotificationType.PAYMENT_DUE, 'Renew your plan', `Your advisor ${user.name} is waiting to help you again — renew your plan to restore your advisor support.`, { advisorId: user.id, isReminder: true });
        return { success: true };
    }
    async createOrUpdateAdvisorPlan(advisorUser, dto) {
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
        }
        else {
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
        const admins = await this.prisma.user.findMany({
            where: {
                OR: [{ role: client_1.Role.ADMIN }, { role: client_1.Role.SUPER_ADMIN }],
                deletedAt: null,
            },
            select: { id: true },
        });
        for (const admin of admins) {
            await this.notificationsService.create(admin.id, client_1.NotificationType.SYSTEM, 'Advisor Plan Pending Approval 📋', `Doctor ${advisorUser.name} submitted a ${dto.hiringModel} plan (${dto.name} - ₹${dto.price}) for Admin review and approval.`, { planId: plan.id, advisorId: advisorUser.id, type: 'ADVISOR_PLAN_PENDING' }).catch(() => { });
        }
        return plan;
    }
    async getMyAdvisorPlans(advisorUser) {
        return this.prisma.advisorPlan.findMany({
            where: { advisorId: advisorUser.id },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getDoctorApprovedPlans(advisorId) {
        return this.prisma.advisorPlan.findMany({
            where: {
                advisorId,
                approvalStatus: 'APPROVED',
                isActive: true,
            },
            orderBy: { price: 'asc' },
        });
    }
    async getPendingAdvisorPlansForAdmin() {
        const plans = await this.prisma.advisorPlan.findMany({
            where: { approvalStatus: 'PENDING_APPROVAL' },
            orderBy: { createdAt: 'desc' },
        });
        const advisorIds = [...new Set(plans.map((p) => p.advisorId).filter(Boolean))];
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
    async adminApproveAdvisorPlan(adminUser, planId, modifications) {
        const plan = await this.prisma.advisorPlan.findUnique({
            where: { id: planId },
        });
        if (!plan) {
            throw new common_1.NotFoundException('Advisor plan not found.');
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
        if (plan.advisorId) {
            const userUpdate = {};
            if (plan.hiringModel === 'MONTHLY_SUBSCRIPTION') {
                userUpdate.feeVipMonthly = updated.price;
            }
            else if (plan.hiringModel === 'PER_CROP') {
                userUpdate.feePerCropSeason = updated.price;
            }
            else if (plan.hiringModel === 'PAY_PER_CONSULTATION') {
                userUpdate.feePerConsultation = updated.price;
            }
            if (Object.keys(userUpdate).length > 0) {
                await this.prisma.user.update({
                    where: { id: plan.advisorId },
                    data: userUpdate,
                }).catch(() => { });
            }
            await this.notificationsService.create(plan.advisorId, client_1.NotificationType.SYSTEM, 'Plan Approved by Admin ✅', `Your advisory plan "${updated.name}" has been approved by FarmsKing Admin and is now LIVE for farmers to subscribe.`, { planId: updated.id, type: 'ADVISOR_PLAN_APPROVED' }).catch(() => { });
        }
        return updated;
    }
    async adminRejectAdvisorPlan(adminUser, planId, reason) {
        const plan = await this.prisma.advisorPlan.findUnique({
            where: { id: planId },
        });
        if (!plan) {
            throw new common_1.NotFoundException('Advisor plan not found.');
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
            await this.notificationsService.create(plan.advisorId, client_1.NotificationType.SYSTEM, 'Plan Rejected by Admin ❌', `Your advisory plan "${plan.name}" was rejected by Admin. Reason: ${reason || 'Does not meet platform guidelines.'}`, { planId: plan.id, type: 'ADVISOR_PLAN_REJECTED' }).catch(() => { });
        }
        return updated;
    }
    async getDoctorSettings(user, targetAdvisorId) {
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
            throw new common_1.NotFoundException('Advisor not found.');
        }
        const appSetting = await this.appSettingsService.get();
        const storedDoctorSettings = appSetting.featureFlags?.doctorSettings?.[advisorId] || {};
        return {
            advisorId,
            advisorName: advisor.name,
            advisorMobile: advisor.mobile,
            advisorKingId: advisor.kingId,
            showMobileNumber: storedDoctorSettings.showMobileNumber ?? false,
            enableWhatsApp: storedDoctorSettings.enableWhatsApp ?? (advisor.whatsappGroupEnabled ?? true),
            enableGsmCalling: storedDoctorSettings.enableGsmCalling ?? (advisor.canTakeCalls ?? false),
            enableInAppAudioCall: storedDoctorSettings.enableInAppAudioCall ?? true,
            enableVideoCall: storedDoctorSettings.enableVideoCall ?? true,
            monthlyPlanEnabled: storedDoctorSettings.monthlyPlanEnabled ?? true,
            monthlyFee: storedDoctorSettings.monthlyPlan1Fee ?? storedDoctorSettings.monthlyFee ?? Number(advisor.feeVipMonthly ?? 299),
            monthlyCallLimit: storedDoctorSettings.monthlyCallLimit ?? 5,
            monthlyInAppCallLimit: storedDoctorSettings.monthlyInAppCallLimit ?? 3,
            monthlyVideoCallLimit: storedDoctorSettings.monthlyVideoCallLimit ?? 2,
            monthlyVideoAllowed: storedDoctorSettings.monthlyVideoAllowed ?? true,
            monthlyChatEnabled: storedDoctorSettings.monthlyChatEnabled ?? true,
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
            plan3MonthsEnabled: storedDoctorSettings.plan3MonthsEnabled ?? true,
            fee3Months: storedDoctorSettings.fee3Months ?? (Math.round(Number(storedDoctorSettings.monthlyPlan1Fee ?? advisor.feeVipMonthly ?? 299) * 3 * (1 - (storedDoctorSettings.discount3Months ?? 10) / 100))),
            callLimit3Months: storedDoctorSettings.callLimit3Months ?? 15,
            videoAllowed3Months: storedDoctorSettings.videoAllowed3Months ?? true,
            plan6MonthsEnabled: storedDoctorSettings.plan6MonthsEnabled ?? true,
            fee6Months: storedDoctorSettings.fee6Months ?? (Math.round(Number(storedDoctorSettings.monthlyPlan1Fee ?? advisor.feeVipMonthly ?? 299) * 6 * (1 - (storedDoctorSettings.discount6Months ?? 15) / 100))),
            callLimit6Months: storedDoctorSettings.callLimit6Months ?? 30,
            videoAllowed6Months: storedDoctorSettings.videoAllowed6Months ?? true,
            plan12MonthsEnabled: storedDoctorSettings.plan12MonthsEnabled ?? true,
            fee12Months: storedDoctorSettings.fee12Months ?? (Math.round(Number(storedDoctorSettings.monthlyPlan1Fee ?? advisor.feeVipMonthly ?? 299) * 12 * (1 - (storedDoctorSettings.discount12Months ?? 25) / 100))),
            callLimit12Months: storedDoctorSettings.callLimit12Months ?? 60,
            videoAllowed12Months: storedDoctorSettings.videoAllowed12Months ?? true,
            cropSeasonPlanEnabled: storedDoctorSettings.cropSeasonPlanEnabled ?? true,
            cropSeasonFee: storedDoctorSettings.cropSeasonFee ?? Number(advisor.feePerCropSeason ?? 499),
            cropSeasonCallLimit: storedDoctorSettings.cropSeasonCallLimit ?? 10,
            cropSeasonVideoAllowed: storedDoctorSettings.cropSeasonVideoAllowed ?? true,
            singleConsultationPlanEnabled: storedDoctorSettings.singleConsultationPlanEnabled ?? true,
            singleConsultationFee: storedDoctorSettings.singleConsultationFee ?? Number(advisor.feePerConsultation ?? 150),
            allCropsSelected: storedDoctorSettings.allCropsSelected ?? false,
            specializedCrops: storedDoctorSettings.specializedCrops ?? advisor.specializedCrops ?? ['Wheat', 'Paddy / Rice', 'Basmati', 'Cotton', 'Mustard', 'Potato', 'Tomato'],
            freeConsultationEnabled: storedDoctorSettings.freeConsultationEnabled ?? false,
            availabilityStatus: storedDoctorSettings.availabilityStatus ?? 'AVAILABLE',
            workingHoursStart: storedDoctorSettings.workingHoursStart ?? '09:00 AM',
            workingHoursEnd: storedDoctorSettings.workingHoursEnd ?? '07:00 PM',
            emergencyConsultation: storedDoctorSettings.emergencyConsultation ?? true,
            welcomeGreeting: storedDoctorSettings.welcomeGreeting ?? 'Welcome to FarmsKing Agronomy Advisory. We are committed to protecting your crops and maximizing your yield.',
            icarRegistrationNumber: storedDoctorSettings.icarRegistrationNumber ?? '',
            qualificationTitle: storedDoctorSettings.qualificationTitle ?? advisor.qualification ?? 'Certified Crop Doctor',
            maxFarmerCapacity: storedDoctorSettings.maxFarmerCapacity ?? 100,
            certifiedAt: storedDoctorSettings.certifiedAt ?? advisor.createdAt.toISOString(),
            testPassedDate: storedDoctorSettings.testPassedDate ?? storedDoctorSettings.certifiedAt ?? advisor.createdAt.toISOString(),
        };
    }
    async updateDoctorSettings(user, dto, targetAdvisorId) {
        const advisorId = targetAdvisorId || user.id;
        const advisor = await this.prisma.user.findUnique({ where: { id: advisorId } });
        if (!advisor) {
            throw new common_1.NotFoundException('Advisor not found.');
        }
        const appSetting = await this.appSettingsService.get();
        const existingFlags = appSetting.featureFlags || {};
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
        const userUpdate = {};
        if (dto.singleConsultationFee !== undefined)
            userUpdate.feePerConsultation = dto.singleConsultationFee;
        if (dto.cropSeasonFee !== undefined)
            userUpdate.feePerCropSeason = dto.cropSeasonFee;
        if (dto.monthlyFee !== undefined)
            userUpdate.feeVipMonthly = dto.monthlyFee;
        if (dto.specializedCrops !== undefined)
            userUpdate.specializedCrops = dto.specializedCrops;
        if (dto.qualificationTitle !== undefined)
            userUpdate.qualification = dto.qualificationTitle;
        if (dto.enableWhatsApp !== undefined)
            userUpdate.whatsappGroupEnabled = dto.enableWhatsApp;
        if (dto.enableGsmCalling !== undefined || dto.enableInAppAudioCall !== undefined) {
            userUpdate.canTakeCalls = Boolean(dto.enableGsmCalling || dto.enableInAppAudioCall);
        }
        if (Object.keys(userUpdate).length > 0) {
            await this.prisma.user.update({
                where: { id: advisorId },
                data: userUpdate,
            }).catch(() => { });
        }
        return this.getDoctorSettings(user, advisorId);
    }
};
exports.AdvisorAssignmentService = AdvisorAssignmentService;
exports.AdvisorAssignmentService = AdvisorAssignmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        wallet_service_1.WalletService,
        whatsapp_group_sync_service_1.WhatsAppGroupSyncService,
        app_settings_service_1.AppSettingsService])
], AdvisorAssignmentService);
//# sourceMappingURL=advisor-assignment.service.js.map